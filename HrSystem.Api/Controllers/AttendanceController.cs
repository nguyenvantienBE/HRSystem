using System.Security.Claims;
using System.Text.Json;
using HrSystem.Api.Contracts.Attendance;
using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using HrSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Manager,Admin")]
    [Produces("application/json")]
    public class AttendanceController : ControllerBase
    {
        private readonly HrDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public AttendanceController(HrDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        #region Helpers

        private string? CurrentEmail() =>
            User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        private async Task<Employee?> GetCurrentEmployeeAsync()
        {
            var email = CurrentEmail();
            if (string.IsNullOrWhiteSpace(email)) return null;
            return await _db.Employees.FirstOrDefaultAsync(e => e.Email == email);
        }

        private static void RecalcBasicTimes(AttendanceRecord r, Shift shift, DateTime dayUtc)
        {
            r.WorkMinutes = r.LateMinutes = r.EarlyMinutes = r.OtMinutes = 0;

            if (!r.CheckIn.HasValue || !r.CheckOut.HasValue) return;

            r.WorkMinutes = (int)(r.CheckOut.Value - r.CheckIn.Value).TotalMinutes;

            var start = dayUtc.Add(shift.StartTime);
            var end   = dayUtc.Add(shift.EndTime);
            var grace = TimeSpan.FromMinutes(shift.GraceMinutes);

            if (r.CheckIn.Value > start + grace)
                r.LateMinutes = (int)(r.CheckIn.Value - start).TotalMinutes;

            if (r.CheckOut.Value < end - grace)
                r.EarlyMinutes = (int)(end - r.CheckOut.Value).TotalMinutes;

            var shiftMinutes = (int)(end - start).TotalMinutes;
            if (r.WorkMinutes > shiftMinutes)
                r.OtMinutes = r.WorkMinutes - shiftMinutes;
        }

        private Task<bool> IsTodayHolidayAsync(DateTime dayUtc)
            => _db.Holidays.AnyAsync(h => h.Date == dayUtc);

        private static double CosineSimilarity(IReadOnlyList<float> a, IReadOnlyList<float> b)
        {
            if (a.Count != b.Count || a.Count == 0) return double.NaN;
            double dot = 0, na = 0, nb = 0;
            for (int i = 0; i < a.Count; i++)
            {
                var x = a[i]; var y = b[i];
                dot += x * y; na += x * x; nb += y * y;
            }
            if (na == 0 || nb == 0) return double.NaN;
            return dot / (Math.Sqrt(na) * Math.Sqrt(nb));
        }

        // NEW: lấy vị trí công ty đang active
        private Task<OfficeLocation?> GetActiveOfficeAsync()
        {
            return _db.OfficeLocations
                .Where(o => o.IsActive)
                .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
                .FirstOrDefaultAsync();
        }

        // NEW: tính khoảng cách 2 toạ độ theo Haversine (mét)
        private static double DistanceInMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000d; // bán kính Trái Đất ~ mét

            double ToRad(double deg) => deg * Math.PI / 180d;

            var dLat = ToRad(lat2 - lat1);
            var dLon = ToRad(lon2 - lon1);

            var a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        #endregion

        // ================== POST /api/attendance/check-in ==================
        [HttpPost("check-in")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest? dto)
        {
            var emp = await GetCurrentEmployeeAsync();
            if (emp == null)
                return Unauthorized(new { message = "Không xác thực được nhân viên hiện tại." });

            Shift? shift = null;

            if (dto != null && dto.ShiftId != Guid.Empty)
            {
                shift = await _db.Shifts.FindAsync(dto.ShiftId);
                if (shift == null)
                    return BadRequest(new { message = "Shift không tồn tại." });
            }
            else
            {
                shift = await _db.Shifts
                    .OrderBy(s => s.StartTime)
                    .FirstOrDefaultAsync();

                if (shift == null)
                    return BadRequest(new { message = "Chưa cấu hình ca làm việc." });
            }

            var todayUtc = DateTime.UtcNow.Date;

            var exists = await _db.AttendanceRecords
                .AnyAsync(x =>
                    x.EmployeeId == emp.Id &&
                    x.Date == todayUtc &&
                    x.ShiftId == shift.Id);

            if (exists)
                return BadRequest(new { message = "Bạn đã check-in ca này hôm nay." });

            var rec = new AttendanceRecord
            {
                EmployeeId = emp.Id,
                ShiftId    = shift.Id,
                Date       = todayUtc,
                CheckIn    = DateTime.UtcNow,
                IsHoliday  = await IsTodayHolidayAsync(todayUtc),
                Status     = "Pending",
                Note       = null
            };

            _db.AttendanceRecords.Add(rec);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Check-in thành công", rec.Id });
        }

        // =============== POST /api/attendance/check-in/face =================
        [HttpPost("check-in/face")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CheckInWithFace([FromBody] FaceCheckInRequest dto)
        {
            var emp = await GetCurrentEmployeeAsync();
            if (emp == null)
                return Unauthorized(new { message = "Không xác thực được nhân viên hiện tại." });

            if (dto.Embedding == null || dto.Embedding.Length == 0)
                return BadRequest(new { message = "Embedding trống." });

            if (string.IsNullOrWhiteSpace(emp.FaceEmbedding))
                return BadRequest(new { message = "Bạn chưa đăng ký khuôn mặt ở Profile." });

            float[]? baseEmb;
            try { baseEmb = JsonSerializer.Deserialize<float[]>(emp.FaceEmbedding); }
            catch { return BadRequest(new { message = "Baseline embedding không hợp lệ." }); }

            if (baseEmb == null || baseEmb.Length == 0)
                return BadRequest(new { message = "Baseline embedding rỗng." });

            var similarity = CosineSimilarity(baseEmb, dto.Embedding);
            const double THRESHOLD = 0.60;

            if (double.IsNaN(similarity) || similarity < THRESHOLD)
                return BadRequest(new
                {
                    message = $"Xác thực khuôn mặt thất bại (similarity={similarity:F2} < {THRESHOLD})."
                });

            // ====== Kiểm tra GPS theo vị trí công ty ======
            var office = await GetActiveOfficeAsync();
            if (office != null)
            {
                if (dto.Latitude == null || dto.Longitude == null)
                    return BadRequest(new { message = "Không có toạ độ GPS để kiểm tra vị trí." });

                var distance = DistanceInMeters(
                    dto.Latitude.Value,
                    dto.Longitude.Value,
                    office.Latitude,
                    office.Longitude
                );

                if (distance > office.RadiusMeters)
                {
                    return BadRequest(new
                    {
                        message = $"Bạn đang ở ngoài phạm vi chấm công (khoảng cách ~{distance:F0} m, " +
                                  $"bán kính cho phép {office.RadiusMeters:F0} m)."
                    });
                }
            }
            // nếu chưa cấu hình OfficeLocation thì tạm thời cho qua (không khoá)

            // ====== Logic tạo bản ghi chấm công giống CheckIn() ======
            Shift? shift = null;

            if (dto.ShiftId != Guid.Empty)
            {
                shift = await _db.Shifts.FindAsync(dto.ShiftId);
                if (shift == null)
                    return BadRequest(new { message = "Shift không tồn tại." });
            }
            else
            {
                shift = await _db.Shifts
                    .OrderBy(s => s.StartTime)
                    .FirstOrDefaultAsync();

                if (shift == null)
                    return BadRequest(new { message = "Chưa cấu hình ca làm việc." });
            }

            var todayUtc = DateTime.UtcNow.Date;

            var exists = await _db.AttendanceRecords
                .AnyAsync(x =>
                    x.EmployeeId == emp.Id &&
                    x.Date == todayUtc &&
                    x.ShiftId == shift.Id);

            if (exists)
                return BadRequest(new { message = "Bạn đã check-in ca này hôm nay." });

            var rec = new AttendanceRecord
            {
                EmployeeId = emp.Id,
                ShiftId    = shift.Id,
                Date       = todayUtc,
                CheckIn    = DateTime.UtcNow,
                IsHoliday  = await IsTodayHolidayAsync(todayUtc),
                Status     = "Pending",
                Note       = null
            };

            _db.AttendanceRecords.Add(rec);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Check-in thành công", rec.Id });
        }

        // ================== POST /api/attendance/check-out ==================
        [HttpPost("check-out")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest? dto)
        {
            var emp = await GetCurrentEmployeeAsync();
            if (emp == null)
                return Unauthorized(new { message = "Không xác thực được nhân viên hiện tại." });

            var todayUtc = DateTime.UtcNow.Date;

            AttendanceRecord? rec = null;
            Shift? shift = null;

            if (dto != null && dto.ShiftId != Guid.Empty)
            {
                shift = await _db.Shifts.FindAsync(dto.ShiftId);
                if (shift == null)
                    return BadRequest(new { message = "Shift không tồn tại." });

                rec = await _db.AttendanceRecords
                    .FirstOrDefaultAsync(x =>
                        x.EmployeeId == emp.Id &&
                        x.Date == todayUtc &&
                        x.ShiftId == dto.ShiftId);
            }
            else
            {
                rec = await _db.AttendanceRecords
                    .Where(x =>
                        x.EmployeeId == emp.Id &&
                        x.Date == todayUtc &&
                        x.CheckOut == null)
                    .OrderByDescending(x => x.CheckIn)
                    .FirstOrDefaultAsync();

                if (rec != null)
                    shift = await _db.Shifts.FindAsync(rec.ShiftId);
            }

            if (rec == null)
                return BadRequest(new { message = "Bạn chưa check-in ca này." });

            if (rec.CheckOut != null)
                return BadRequest(new { message = "Đã check-out rồi." });

            if (shift == null)
                return BadRequest(new { message = "Không xác định được ca làm để tính giờ." });

            rec.CheckOut  = DateTime.UtcNow;
            rec.IsHoliday = await IsTodayHolidayAsync(todayUtc);
            RecalcBasicTimes(rec, shift, todayUtc);

            if (string.IsNullOrEmpty(rec.Status) || rec.Status == "Pending")
                rec.Status = "Pending";

            await _db.SaveChangesAsync();
            return Ok(new { message = "Check-out thành công", rec });
        }

        // ================== GET /api/attendance/today ==================
        [HttpGet("today")]
        [ProducesResponseType(typeof(TodayAttendanceDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetToday()
        {
            var emp = await GetCurrentEmployeeAsync();
            if (emp == null) return Unauthorized();

            var todayUtc = DateTime.UtcNow.Date;

            var records = await _db.AttendanceRecords
                .Where(r => r.EmployeeId == emp.Id && r.Date == todayUtc)
                .OrderBy(r => r.CheckIn)
                .ToListAsync();

            if (!records.Any())
            {
                return Ok(new TodayAttendanceDto
                {
                    HasRecord      = false,
                    ShiftId        = null,
                    ShiftName      = null,
                    FirstCheckInAt = null,
                    LastCheckOutAt = null,
                    Status         = null
                });
            }

            var first = records.First();
            var last  = records.Last();
            var shift = await _db.Shifts.FindAsync(first.ShiftId);

            var dto = new TodayAttendanceDto
            {
                HasRecord      = true,
                ShiftId        = first.ShiftId,
                ShiftName      = shift?.Name,
                FirstCheckInAt = first.CheckIn,
                LastCheckOutAt = last.CheckOut,
                Status         = last.Status
            };

            return Ok(dto);
        }

        // ================== GET /api/attendance (Admin/Manager) ==================
        [Authorize(Roles = "Manager,Admin")]
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<AttendanceRecord>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] Guid? employeeId,
            [FromQuery] string? status)
        {
            var q = _db.AttendanceRecords.AsQueryable();

            if (from.HasValue)       q = q.Where(x => x.Date >= from.Value.Date);
            if (to.HasValue)         q = q.Where(x => x.Date <= to.Value.Date);
            if (employeeId.HasValue) q = q.Where(x => x.EmployeeId == employeeId.Value);
            if (!string.IsNullOrWhiteSpace(status))
                q = q.Where(x => x.Status == status);

            var list = await q.OrderBy(x => x.Date).ToListAsync();
            return Ok(list);
        }

        // ================== Workflow Approve / Reject / Fix ==================
        public class ApproveDto { public string? ManagerNote { get; set; } }
        public class RejectDto  { public string? Reason      { get; set; } }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}/approve")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveDto dto)
        {
            var rec = await _db.AttendanceRecords.FindAsync(id);
            if (rec == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var user   = await _userManager.FindByIdAsync(userId);

            rec.Status       = "Approved";
            rec.ApprovedAt   = DateTime.UtcNow;
            rec.ApproverId   = user?.Id;
            rec.ApproverName = user?.FullName ?? user?.UserName ?? "Manager";
            rec.ManagerNote  = dto?.ManagerNote;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}/reject")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDto dto)
        {
            var rec = await _db.AttendanceRecords.FindAsync(id);
            if (rec == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var user   = await _userManager.FindByIdAsync(userId);

            rec.Status       = "Rejected";
            rec.ApprovedAt   = DateTime.UtcNow;
            rec.ApproverId   = user?.Id;
            rec.ApproverName = user?.FullName ?? user?.UserName ?? "Manager";
            rec.ManagerNote  = dto?.Reason;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        public class FixDto
        {
            public DateTime? ManualCheckIn  { get; set; }
            public DateTime? ManualCheckOut { get; set; }
            public string?   FixReason      { get; set; }
            public string?   ManagerNote    { get; set; }
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}/fix")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Fix(Guid id, [FromBody] FixDto dto)
        {
            var rec = await _db.AttendanceRecords.FindAsync(id);
            if (rec == null) return NotFound();

            var shift = await _db.Shifts.FindAsync(rec.ShiftId);
            if (shift == null)
                return BadRequest(new { message = "Shift không tồn tại." });

            if (dto.ManualCheckIn.HasValue)  rec.CheckIn  = dto.ManualCheckIn.Value;
            if (dto.ManualCheckOut.HasValue) rec.CheckOut = dto.ManualCheckOut.Value;

            RecalcBasicTimes(rec, shift, rec.Date);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var user   = await _userManager.FindByIdAsync(userId);

            rec.FixReason    = dto.FixReason;
            rec.ManagerNote  = dto.ManagerNote;
            rec.Status       = "Fixed";
            rec.ApprovedAt   = DateTime.UtcNow;
            rec.ApproverId   = user?.Id;
            rec.ApproverName = user?.FullName ?? user?.UserName ?? "Manager";

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
