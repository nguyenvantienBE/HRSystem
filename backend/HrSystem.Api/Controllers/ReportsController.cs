using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;                 // ensure
using System.Linq;            // ensure LINQ extension methods are available
using System.Threading.Tasks; // ensure

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Manager,Admin,Staff")]
    public class ReportsController : ControllerBase
    {
        private readonly HrDbContext _db;
        public ReportsController(HrDbContext db) => _db = db;

        // GET: /api/reports/timesheet?employeeId={GUID}&month=YYYY-MM
        [HttpGet("timesheet")]
        public async Task<IActionResult> GetTimesheet([FromQuery] Guid employeeId, [FromQuery] string month)
        {
            if (!TryParseMonth(month, out var from, out var to))
                return BadRequest(new { message = "month cần dạng YYYY-MM (vd: 2025-09)" });

            // Attendance theo tháng
            var att = await _db.AttendanceRecords
                .Where(x => x.EmployeeId == employeeId && x.Date >= from && x.Date <= to)
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Leave đã approve trong tháng (JOIN để lấy Paid, không cần navigation)
            var leaves = await _db.LeaveRequests
                .Where(l => l.EmployeeId == employeeId
                            && l.Status == "Approved"
                            && l.FromDate <= to && l.ToDate >= from)
                .Join(_db.LeaveTypes,
                        l => l.LeaveTypeId,
                        lt => lt.Id,
                        (l, lt) => new { l.Days, Paid = lt.Paid })
                .ToListAsync();

            // Holidays trong tháng (dùng cho thống kê/hiển thị)
            var holidays = await _db.Holidays
                .Where(h => h.Date >= from && h.Date <= to)
                .Select(h => h.Date.Date)
                .ToListAsync();

            // Chi tiết theo ngày
            var daily = att.Select(x => new TimesheetDayDto
            {
                Date         = x.Date,
                CheckIn      = x.CheckIn,
                CheckOut     = x.CheckOut,
                WorkMinutes  = x.WorkMinutes,
                LateMinutes  = x.LateMinutes,
                EarlyMinutes = x.EarlyMinutes,
                OtMinutes    = x.OtMinutes,
                IsHoliday    = x.IsHoliday
            }).ToList();

            // Tổng hợp
            var total = new TimesheetSummaryDto
            {
                TotalWorkMinutes    = att.Sum(x => x.WorkMinutes),
                TotalLateMinutes    = att.Sum(x => x.LateMinutes),
                TotalEarlyMinutes   = att.Sum(x => x.EarlyMinutes),
                TotalOtMinutes      = att.Sum(x => x.OtMinutes),
                TotalHolidayShifts  = att.Count(x => x.IsHoliday),
                TotalLeavePaidDays   = leaves.Where(l => l.Paid).Sum(l => l.Days),
                TotalLeaveUnpaidDays = leaves.Where(l => !l.Paid).Sum(l => l.Days),
            };

            return Ok(new TimesheetResultDto
            {
                EmployeeId = employeeId,
                Month = month,
                From = from,
                To = to,
                Summary = total,
                Daily = daily
            });
        }

        private static bool TryParseMonth(string month, out DateTime from, out DateTime to)
        {
            from = to = default;
            if (string.IsNullOrWhiteSpace(month)) return false;
            if (!DateTime.TryParse($"{month}-01", out var first)) return false;
            from = new DateTime(first.Year, first.Month, 1);
            to   = from.AddMonths(1).AddDays(-1);
            return true;
        }
    }

    // ===== DTOs =====
    public class TimesheetResultDto
    {
        public Guid EmployeeId { get; set; }
        public string Month { get; set; } = default!;
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public TimesheetSummaryDto Summary { get; set; } = default!;
        public System.Collections.Generic.List<TimesheetDayDto> Daily { get; set; } = new();
    }

    public class TimesheetSummaryDto
    {
        public int TotalWorkMinutes { get; set; }
        public int TotalLateMinutes { get; set; }
        public int TotalEarlyMinutes { get; set; }
        public int TotalOtMinutes { get; set; }
        public int TotalHolidayShifts { get; set; }
        public int TotalLeavePaidDays { get; set; }
        public int TotalLeaveUnpaidDays { get; set; }
    }

    public class TimesheetDayDto
    {
        public DateTime Date { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public int WorkMinutes { get; set; }
        public int LateMinutes { get; set; }
        public int EarlyMinutes { get; set; }
        public int OtMinutes { get; set; }
        public bool IsHoliday { get; set; }
    }
}
