using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using HrSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Infrastructure.Seed
{
    public static class EmployeeSeeder
    {
        /// <summary>
        /// Đảm bảo mỗi ApplicationUser có 1 Employee tương ứng (match theo Email).
        /// - Chỉ tạo khi chưa tồn tại Employee (tránh trùng).
        /// - Code sinh lần lượt E0001, E0002... luôn duy nhất.
        /// - Gán Department/Position mặc định (lấy phần tử đầu tiên nếu có).
        /// </summary>
        public static async Task EnsureEmployeesForUsersAsync(
            HrDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            // Danh mục tối thiểu
            var depts = await context.Departments.AsNoTracking().ToListAsync();
            var poss  = await context.Positions.AsNoTracking().ToListAsync();
            if (!depts.Any() || !poss.Any()) return; // cần DataSeeder chạy trước

            // Các email đã có Employee -> không tạo nữa
            var existedEmails = await context.Employees
                .AsNoTracking()
                .Select(e => e.Email)
                .ToHashSetAsync();

            // Tập mã đã dùng để chống đụng độ trong phiên seed này
            var usedCodes = await context.Employees
                .AsNoTracking()
                .Select(e => e.Code)
                .ToHashSetAsync();

            // Bắt đầu từ số kế tiếp trong DB
            var nextNo = await GetNextNumberAsync(context);

            // Lấy toàn bộ users
            var users = await userManager.Users.AsNoTracking().ToListAsync();
            var toAdd = new List<Employee>();

            foreach (var u in users)
            {
                if (string.IsNullOrWhiteSpace(u.Email)) continue;     // bỏ user không có email
                if (existedEmails.Contains(u.Email)) continue;         // đã có employee

                // Sinh mã không trùng: E0001, E0002, ...
                string code;
                do
                {
                    code = $"E{nextNo:0000}";
                    nextNo++;
                } while (usedCodes.Contains(code));
                usedCodes.Add(code);

                toAdd.Add(new Employee
                {
                    // Id để EF tự sinh (nếu model bạn để Guid default thì không cần gán)
                    Code         = code,
                    FullName     = u.FullName ?? u.Email!,
                    Email        = u.Email!,
                    Phone        = u.PhoneNumber ?? string.Empty,
                    DepartmentId = depts.First().Id,
                    PositionId   = poss.First().Id,
                    JoinDate     = DateTime.UtcNow,
                    IsActive     = true
                });
            }

            if (toAdd.Count > 0)
            {
                context.Employees.AddRange(toAdd);
                await context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Đọc mã lớn nhất hiện có (E0007 -> 7) và trả về số kế tiếp (8).
        /// </summary>
        private static async Task<int> GetNextNumberAsync(HrDbContext context)
{
    // Lấy tất cả mã Code hiện có về bộ nhớ (list string)
    var codes = await context.Employees
        .AsNoTracking()
        .Select(e => e.Code)
        .ToListAsync();

    // Ép về số: E0007 -> 7, còn lại -> 0
    var max = codes
        .Select(c =>
        {
            if (!string.IsNullOrEmpty(c) && c.StartsWith("E") &&
                int.TryParse(c.Substring(1), out var n))
            {
                return n;
            }
            return 0;
        })
        .DefaultIfEmpty(0)
        .Max();

    return max + 1;
}

    }
}
