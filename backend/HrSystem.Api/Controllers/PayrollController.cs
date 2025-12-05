using System.Security.Claims;
using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Mặc định: yêu cầu đăng nhập, phân quyền chi tiết ở từng action
    public class PayrollController : ControllerBase
    {
        private readonly HrDbContext _db;

        // Chuẩn công tháng (MVP – theo tài liệu BA)
        private const int StandardDailyMinutes = 480;              // 8 giờ
        private const int StandardWorkDaysPerMonth = 22;           // 22 ngày / tháng
        private const decimal DefaultLatePenaltyPerMinute = 5000m; // 5k / phút đi trễ / về sớm

        public PayrollController(HrDbContext db) => _db = db;

        #region Helpers: Current Employee + Month parse + Salary helpers

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

        /// <summary>
        /// Parse "YYYY-MM" => from/to (ngày đầu và ngày cuối tháng)
        /// </summary>
        private static bool TryParseMonth(string month, out DateTime from, out DateTime to)
        {
            from = to = default;
            if (string.IsNullOrWhiteSpace(month)) return false;
            if (!DateTime.TryParse($"{month}-01", out var first)) return false;

            from = new DateTime(first.Year, first.Month, 1);
            to = from.AddMonths(1).AddDays(-1);
            return true;
        }

        private static decimal CalcStandardMonthlyHours()
        {
            var standardDailyHours = StandardDailyMinutes / 60m;
            return standardDailyHours * StandardWorkDaysPerMonth;
        }

        /// <summary>
        /// Từ lương tháng => đơn giá giờ
        /// </summary>
        private static decimal CalcHourlyRateFromMonthly(decimal baseSalary)
        {
            var monthlyHours = CalcStandardMonthlyHours();
            if (monthlyHours <= 0) return 0;
            return Math.Round(baseSalary / monthlyHours, 2);
        }

        /// <summary>
        /// Từ đơn giá giờ => lương tháng (ước tính theo chuẩn công)
        /// </summary>
        private static decimal CalcMonthlySalaryFromHourly(decimal baseRate)
        {
            var monthlyHours = CalcStandardMonthlyHours();
            return Math.Round(baseRate * monthlyHours, 0);
        }

        #endregion

        // ============================================================
        // 1. Staff / Manager xem phiếu lương của CHÍNH MÌNH
        //    GET: /api/payroll/my?month=2025-11
        //    Có thể override baseSalary/allowance qua query nếu muốn.
        // ============================================================
        [HttpGet("my")]
        [Authorize(Roles = "Staff,Manager,Admin")]
        [ProducesResponseType(typeof(PayrollResultDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyPayslip(
            [FromQuery] string? month,
            [FromQuery] decimal? baseSalary,
            [FromQuery] decimal? allowance,
            [FromQuery] decimal otRate = 1.5m,
            [FromQuery] decimal holidayRate = 2.0m)
        {
            var emp = await GetCurrentEmployeeAsync();
            if (emp == null)
                return Unauthorized(new { message = "Không xác thực được nhân viên hiện tại." });

            // Nếu FE không truyền month => lấy tháng hiện tại
            month ??= DateTime.UtcNow.ToString("yyyy-MM");

            if (!TryParseMonth(month, out var from, out var to))
                return BadRequest(new { message = "month cần dạng YYYY-MM (vd: 2025-11)" });

            // Ưu tiên: query param -> cấu hình Employee -> default cũ
            var resolvedBaseSalary =
                baseSalary
                ?? emp.BaseSalary
                ?? 15000000m;

            var resolvedAllowance =
                allowance
                ?? emp.Allowance
                ?? 1500000m;

            var baseRate = CalcHourlyRateFromMonthly(resolvedBaseSalary);

            var result = await ComputePayrollAsync(
                emp,
                month,
                from,
                to,
                resolvedBaseSalary,
                resolvedAllowance,
                baseRate,
                otRate,
                holidayRate,
                DefaultLatePenaltyPerMinute);

            return Ok(result);
        }

        // ============================================================
        // 2. Manager/Admin tính lương cho 1 nhân viên bất kỳ
        //    (giữ lại API cũ dùng baseRate để tránh phá vỡ FE đang dùng)
        //    GET: /api/payroll/calc?employeeId=...&month=YYYY-MM&baseRate=50000
        // ============================================================
        [HttpGet("calc")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(PayrollResultDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Calc(
            [FromQuery] Guid employeeId,
            [FromQuery] string month,
            [FromQuery] decimal baseRate,
            [FromQuery] decimal otRate = 1.5m,
            [FromQuery] decimal holidayRate = 2.0m)
        {
            if (baseRate <= 0)
                return BadRequest(new { message = "baseRate phải > 0" });

            if (!TryParseMonth(month, out var from, out var to))
                return BadRequest(new { message = "month cần dạng YYYY-MM (vd: 2025-11)" });

            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId);
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên." });

            // Ước tính lương tháng từ đơn giá giờ
            var baseSalary = CalcMonthlySalaryFromHourly(baseRate);
            const decimal allowance = 0m;

            var result = await ComputePayrollAsync(
                emp,
                month,
                from,
                to,
                baseSalary,
                allowance,
                baseRate,
                otRate,
                holidayRate,
                DefaultLatePenaltyPerMinute);

            return Ok(result);
        }

        // ============================================================
        // 3. Manager/Admin xem phiếu lương 1 nhân viên dựa trên lương đã lưu
        //    GET: /api/payroll/employee-payslip?employeeId=...&month=YYYY-MM
        // ============================================================
        [HttpGet("employee-payslip")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(PayrollResultDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEmployeePayslip(
            [FromQuery] Guid employeeId,
            [FromQuery] string? month,
            [FromQuery] decimal? baseSalary,
            [FromQuery] decimal? allowance,
            [FromQuery] decimal otRate = 1.5m,
            [FromQuery] decimal holidayRate = 2.0m)
        {
            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId);
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên." });

            month ??= DateTime.UtcNow.ToString("yyyy-MM");

            if (!TryParseMonth(month, out var from, out var to))
                return BadRequest(new { message = "month cần dạng YYYY-MM (vd: 2025-11)" });

            var resolvedBaseSalary =
                baseSalary
                ?? emp.BaseSalary
                ?? 15000000m;

            var resolvedAllowance =
                allowance
                ?? emp.Allowance
                ?? 1500000m;

            var baseRate = CalcHourlyRateFromMonthly(resolvedBaseSalary);

            var result = await ComputePayrollAsync(
                emp,
                month,
                from,
                to,
                resolvedBaseSalary,
                resolvedAllowance,
                baseRate,
                otRate,
                holidayRate,
                DefaultLatePenaltyPerMinute);

            return Ok(result);
        }

        // ============================================================
        // Core tính lương – dùng chung cho cả /my, /calc, /employee-payslip
        // ============================================================
        private async Task<PayrollResultDto> ComputePayrollAsync(
            Employee emp,
            string month,
            DateTime from,
            DateTime to,
            decimal baseSalary,
            decimal allowance,
            decimal baseRate,
            decimal otRate,
            decimal holidayRate,
            decimal latePenaltyPerMinute)
        {
            // ---- Attendance trong kỳ ----
            var att = await _db.AttendanceRecords
                .Where(x => x.EmployeeId == emp.Id && x.Date >= from && x.Date <= to)
                .ToListAsync();

            int workMins = att.Sum(x => x.WorkMinutes);
            int otMins = att.Sum(x => x.OtMinutes);
            int lateMins = att.Sum(x => x.LateMinutes);
            int earlyMins = att.Sum(x => x.EarlyMinutes);
            int penaltyMinutes = lateMins + earlyMins;

            int holidayWorkMins = att.Where(x => x.IsHoliday).Sum(x => x.WorkMinutes);
            int normalWorkMins = workMins - holidayWorkMins - otMins;
            if (normalWorkMins < 0) normalWorkMins = 0;

            decimal workHours = Math.Round(normalWorkMins / 60m, 2);
            decimal otHours = Math.Round(otMins / 60m, 2);
            decimal holidayHours = Math.Round(holidayWorkMins / 60m, 2);

            // ---- Leave trong kỳ (đã duyệt) ----
            var leaveWithTypes = await _db.LeaveRequests
                .Where(l =>
                    l.EmployeeId == emp.Id &&
                    l.Status == "Approved" &&
                    l.FromDate <= to &&
                    l.ToDate >= from)
                .Join(
                    _db.LeaveTypes,
                    l => l.LeaveTypeId,
                    lt => lt.Id,
                    (l, lt) => new
                    {
                        l.Days,
                        Paid = lt.Paid
                    })
                .ToListAsync();

            int paidLeaveDays = leaveWithTypes
                .Where(x => x.Paid)
                .Sum(x => x.Days);

            int unpaidLeaveDays = leaveWithTypes
                .Where(x => !x.Paid)
                .Sum(x => x.Days);

            // ---- Tiền lương ----
            decimal normalPay = workHours * baseRate;
            decimal otPay = otHours * baseRate * otRate;
            decimal holidayPay = holidayHours * baseRate * holidayRate;

            decimal deductionLate = penaltyMinutes * latePenaltyPerMinute;

            var standardDailyHours = StandardDailyMinutes / 60m;
            var monthlyHours = CalcStandardMonthlyHours();
            var hourlyFromMonthly = monthlyHours > 0
                ? baseSalary / monthlyHours
                : 0;

            decimal deductionUnpaid = unpaidLeaveDays * standardDailyHours * hourlyFromMonthly;

            decimal otherDeduction = 0m; // BHXH/Thuế... (MVP: 0)
            decimal grossPay = baseSalary + allowance + otPay + holidayPay;
            decimal totalDeduction = deductionLate + deductionUnpaid + otherDeduction;

            decimal tax = 0m; // MVP: chưa tính thuế
            decimal netPay = grossPay - totalDeduction - tax;

            return new PayrollResultDto
            {
                EmployeeId = emp.Id,
                EmployeeCode = emp.Code,
                FullName = emp.FullName,
                Month = month,

                BaseSalary = baseSalary,
                Allowance = allowance,

                BaseRate = baseRate,
                OtRate = otRate,
                HolidayRate = holidayRate,

                WorkHours = workHours,
                OtHours = otHours,
                HolidayHours = holidayHours,

                LateMinutes = lateMins,
                EarlyMinutes = earlyMins,
                PaidLeaveDays = paidLeaveDays,
                UnpaidLeaveDays = unpaidLeaveDays,

                NormalPay = normalPay,
                OtPay = otPay,
                HolidayPay = holidayPay,

                DeductionLate = deductionLate,
                DeductionUnpaid = deductionUnpaid,
                OtherDeduction = otherDeduction,

                GrossPay = grossPay,
                Tax = tax,
                NetPay = netPay,

                // Giữ lại field cũ cho tương thích
                Penalty = totalDeduction,
                TotalPay = netPay
            };
        }
    }

    /// <summary>
    /// DTO trả về cho Payslip / Payroll
    /// </summary>
    public class PayrollResultDto
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = default!;
        public string FullName { get; set; } = default!;

        public string Month { get; set; } = default!;

        // Thông tin lương & hệ số
        public decimal BaseSalary { get; set; }
        public decimal Allowance { get; set; }

        public decimal BaseRate { get; set; }     // đơn giá giờ
        public decimal OtRate { get; set; }
        public decimal HolidayRate { get; set; }

        // Thời gian
        public decimal WorkHours { get; set; }
        public decimal OtHours { get; set; }
        public decimal HolidayHours { get; set; }

        public int LateMinutes { get; set; }
        public int EarlyMinutes { get; set; }

        public int PaidLeaveDays { get; set; }
        public int UnpaidLeaveDays { get; set; }

        // Tiền lương chi tiết
        public decimal NormalPay { get; set; }
        public decimal OtPay { get; set; }
        public decimal HolidayPay { get; set; }

        public decimal DeductionLate { get; set; }
        public decimal DeductionUnpaid { get; set; }
        public decimal OtherDeduction { get; set; }

        public decimal GrossPay { get; set; }
        public decimal Tax { get; set; }
        public decimal NetPay { get; set; }

        // Field cũ (giữ lại cho an toàn)
        public decimal Penalty { get; set; }   // = tổng khấu trừ
        public decimal TotalPay { get; set; }  // = NetPay
    }
}
