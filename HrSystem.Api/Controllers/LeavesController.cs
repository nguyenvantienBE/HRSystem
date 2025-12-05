using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Manager,Admin")]
    public class LeavesController : ControllerBase
    {
        private readonly HrDbContext _db;
        public LeavesController(HrDbContext db) => _db = db;

        // ============ Staff tạo đơn ============
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLeaveDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var employee = await _db.Employees.FirstOrDefaultAsync(x => x.Email == email);
            if (employee == null) return BadRequest(new { message = "Không tìm thấy Employee của bạn." });

            if (dto.FromDate.Date > dto.ToDate.Date) 
                return BadRequest(new { message = "Khoảng ngày không hợp lệ." });

            // Tính số ngày làm việc (bỏ T7, CN, Holiday)
            var days = await CountWorkingDaysAsync(dto.FromDate.Date, dto.ToDate.Date);

            var entity = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                LeaveTypeId = dto.LeaveTypeId,
                FromDate = dto.FromDate.Date,
                ToDate = dto.ToDate.Date,
                Days = days,
                Reason = dto.Reason,
                Status = "Pending"
            };

            _db.LeaveRequests.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(entity);
        }

        // ============ Staff xem đơn của mình ============
        [HttpGet("my")]
        public async Task<IActionResult> MyLeaves()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var emp = await _db.Employees.FirstOrDefaultAsync(x => x.Email == email);
            if (emp == null) return BadRequest(new { message = "Không tìm thấy Employee của bạn." });

            var data = await _db.LeaveRequests
                .Where(x => x.EmployeeId == emp.Id)
                .OrderByDescending(x => x.FromDate)
                .ToListAsync();

            return Ok(data);
        }

        // ============ Manager/Admin duyệt/từ chối ============
        [Authorize(Roles = "Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var query = _db.LeaveRequests.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(x => x.Status == status);
            var data = await query
                .OrderByDescending(x => x.FromDate)
                .ToListAsync();
            return Ok(data);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var approver = await _db.Employees.FirstOrDefaultAsync(x => x.Email == email);
            if (approver == null) return BadRequest(new { message = "Không tìm thấy Employee của người duyệt." });

            var req = await _db.LeaveRequests.FindAsync(id);
            if (req == null) return NotFound();
            if (req.Status != "Pending") return BadRequest(new { message = "Đơn không ở trạng thái Pending." });

            req.Status = "Approved";
            req.ApproverId = approver.Id;
            req.DecisionAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Approved", req.Id, req.Days });
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("{id:guid}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var approver = await _db.Employees.FirstOrDefaultAsync(x => x.Email == email);
            if (approver == null) return BadRequest(new { message = "Không tìm thấy Employee của người duyệt." });

            var req = await _db.LeaveRequests.FindAsync(id);
            if (req == null) return NotFound();
            if (req.Status != "Pending") return BadRequest(new { message = "Đơn không ở trạng thái Pending." });

            req.Status = "Rejected";
            req.ApproverId = approver.Id;
            req.DecisionAt = DateTime.UtcNow;
            req.Note = dto.Note;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Rejected", req.Id });
        }

        // ============ Helper: tính ngày làm việc ============
        private async Task<int> CountWorkingDaysAsync(DateTime from, DateTime to)
        {
            var holidays = await _db.Holidays
                .Where(h => h.Date >= from && h.Date <= to)
                .Select(h => h.Date.Date)
                .ToListAsync();

            int days = 0;
            for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
            {
                if (d.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;
                if (holidays.Contains(d)) continue;
                days++;
            }
            return days;
        }
    }

    // DTOs
    public class CreateLeaveDto
    {
        public Guid LeaveTypeId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string? Reason { get; set; }
    }

    public class RejectDto
    {
        public string? Note { get; set; }
    }
}
