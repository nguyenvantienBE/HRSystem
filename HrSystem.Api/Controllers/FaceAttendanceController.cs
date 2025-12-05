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
    /// <summary>
    /// Flow CHECK IN / OUT bằng Face ID + (tùy chọn) GPS.
    /// Không sửa hoặc thay thế AttendanceController cũ.
    /// Route: /api/faceattendance/...
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Manager,Admin")]
    public class FaceAttendanceController : ControllerBase
    {
        private readonly HrDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        // Ngưỡng khớp khuôn mặt (cosine similarity)
        private const double FaceMatchThreshold = 0.75;

        public FaceAttendanceController(
            HrDbContext db,
            UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // =========================================================
        // Helpers
        // =========================================================

        private string? CurrentEmail()
        {
            return User.FindFirstValue(ClaimTypes.Email)
                   ?? User.Identity?.Name
                   ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        /// <summary>
        /// Lấy Employee tương ứng user hiện tại, nếu chưa có thì tạo mới
        /// (logic tương tự trong EmployeesController, nhưng không sửa file đó).
        /// </summary>
        private async Task<Employee?> EnsureEmployeeForCurrentUserAsync()
        {
            var email = CurrentEmail();
            if (string.IsNullOrWhiteSpace(email))
                return null;

            var emp = await _db.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Email == email);

            if (emp != null)
                return emp;

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return null;

            var nextNo = await _db.Employees.CountAsync() + 1;
            string NewCode(int n) => $"E{n:0000}";

            emp = new Employee
            {
                Id = Guid.NewGuid(),
                Code = NewCode(nextNo),
                Email = email,
                FullName = string.IsNullOrWhiteSpace(user.FullName)
                    ? (user.UserName ?? email)
                    : user.FullName,
                Phone = user.PhoneNumber,
                JoinDate = DateTime.UtcNow,
                IsActive = true
            };

            _db.Employees.Add(emp);
            await _db.SaveChangesAsync();
            return emp;
        }

        private static float[] ParseEmbedding(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return Array.Empty<float>();

            try
            {
                var arr = JsonSerializer.Deserialize<float[]>(json);
                return arr ?? Array.Empty<float>();
            }
            catch
            {
                return Array.Empty<float>();
            }
        }

        private static double CosineSimilarity(float[] a, float[] b)
        {
            if (a == null || b == null) return 0.0;
            if (a.Length == 0 || b.Length == 0) return 0.0;
            if (a.Length != b.Length) return 0.0;

            double dot = 0, magA = 0, magB = 0;
            for (int i = 0; i < a.Length; i++)
            {
                dot += a[i] * b[i];
                magA += a[i] * a[i];
                magB += b[i] * b[i];
            }

            if (magA == 0 || magB == 0) return 0.0;
            return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
        }

        /// <summary>
        /// Tạm thời chấp nhận mọi vị trí, chỉ để chỗ hook logic geofence sau này.
        /// </summary>
        private bool ValidateLocation(double? lat, double? lng)
        {
            // TODO: sau này có thể so sánh với cấu hình toạ độ công ty.
            return true;
        }

        private async Task<AttendanceRecord?> GetTodayRecord(Guid employeeId)
        {
            var today = DateTime.UtcNow.Date;

            return await _db.AttendanceRecords
                .Where(r => r.EmployeeId == employeeId && r.Date == today)
                .FirstOrDefaultAsync();
        }

        // =========================================================
        // GET /api/faceattendance/today
        // =========================================================
        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cho tài khoản hiện tại." });

            var record = await GetTodayRecord(emp.Id);

            return Ok(new
            {
                employeeId = emp.Id,
                employeeName = emp.FullName,
                date = DateTime.UtcNow.Date,
                checkIn = record?.CheckIn,
                checkOut = record?.CheckOut,
                hasCheckIn = record?.CheckIn != null,
                hasCheckOut = record?.CheckOut != null,
                status = record?.Status
            });
        }

        // =========================================================
        // POST /api/faceattendance/checkin
        // =========================================================
        [HttpPost("checkin")]
        public async Task<IActionResult> FaceCheckIn([FromBody] FaceCheckInRequest request)
        {
            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cho tài khoản hiện tại." });

            if (!ValidateLocation(request.Latitude, request.Longitude))
            {
                return BadRequest(new { message = "Vị trí không hợp lệ cho phép chấm công." });
            }

            var baseEmbedding = ParseEmbedding(emp.FaceEmbedding);
            if (baseEmbedding.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Bạn chưa đăng ký khuôn mặt trong hồ sơ. Vui lòng vào Profile để quét khuôn mặt trước."
                });
            }

            var similarity = CosineSimilarity(baseEmbedding, request.Embedding ?? Array.Empty<float>());
            if (similarity < FaceMatchThreshold)
            {
                return BadRequest(new
                {
                    message = "Khuôn mặt không trùng khớp với hồ sơ. Vui lòng thử lại.",
                    similarity
                });
            }

            var today = DateTime.UtcNow.Date;
            var now = DateTime.UtcNow;

            var record = await GetTodayRecord(emp.Id);
            if (record != null && record.CheckIn.HasValue)
            {
                return BadRequest(new { message = "Hôm nay bạn đã check in rồi." });
            }

            if (record == null)
            {
                record = new AttendanceRecord
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = emp.Id,
                    // Nếu chưa có logic xác định shift, cứ để Guid.Empty; 
                    // không đụng tới flow tính công cũ.
                    ShiftId = Guid.Empty,
                    Date = today,
                    Status = "Pending"
                };
                _db.AttendanceRecords.Add(record);
            }

            record.CheckIn = now;

            // Ghi chú thêm thông tin Face/GPS vào Note (không phá DB)
            var note = $"Face check-in {now:HH:mm:ss}, sim={similarity:F2}";
            if (request.Latitude.HasValue && request.Longitude.HasValue)
            {
                note += $" @({request.Latitude:F6},{request.Longitude:F6})";
            }
            if (!string.IsNullOrWhiteSpace(request.LocationName))
            {
                note += $" - {request.LocationName}";
            }

            record.Note = string.IsNullOrWhiteSpace(record.Note)
                ? note
                : $"{record.Note} | {note}";

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Check in thành công.",
                checkIn = record.CheckIn,
                similarity
            });
        }

        // =========================================================
        // POST /api/faceattendance/checkout
        // =========================================================
        [HttpPost("checkout")]
        public async Task<IActionResult> FaceCheckOut([FromBody] FaceCheckInRequest request)
        {
            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cho tài khoản hiện tại." });

            if (!ValidateLocation(request.Latitude, request.Longitude))
            {
                return BadRequest(new { message = "Vị trí không hợp lệ cho phép chấm công." });
            }

            var baseEmbedding = ParseEmbedding(emp.FaceEmbedding);
            if (baseEmbedding.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Bạn chưa đăng ký khuôn mặt trong hồ sơ. Vui lòng vào Profile để quét khuôn mặt trước."
                });
            }

            var similarity = CosineSimilarity(baseEmbedding, request.Embedding ?? Array.Empty<float>());
            if (similarity < FaceMatchThreshold)
            {
                return BadRequest(new
                {
                    message = "Khuôn mặt không trùng khớp với hồ sơ. Vui lòng thử lại.",
                    similarity
                });
            }

            var record = await GetTodayRecord(emp.Id);
            if (record == null || !record.CheckIn.HasValue)
            {
                return BadRequest(new { message = "Bạn chưa check in hôm nay nên không thể check out." });
            }

            if (record.CheckOut.HasValue)
            {
                return BadRequest(new { message = "Hôm nay bạn đã check out rồi." });
            }

            var now = DateTime.UtcNow;
            record.CheckOut = now;

            var note = $"Face check-out {now:HH:mm:ss}, sim={similarity:F2}";
            if (request.Latitude.HasValue && request.Longitude.HasValue)
            {
                note += $" @({request.Latitude:F6},{request.Longitude:F6})";
            }
            if (!string.IsNullOrWhiteSpace(request.LocationName))
            {
                note += $" - {request.LocationName}";
            }

            record.Note = string.IsNullOrWhiteSpace(record.Note)
                ? note
                : $"{record.Note} | {note}";

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Check out thành công.",
                checkOut = record.CheckOut,
                similarity
            });
        }
    }
}
