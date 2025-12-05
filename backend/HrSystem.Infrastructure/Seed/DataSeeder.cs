using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedDataAsync(HrDbContext context)
    {
        if (!await context.Departments.AnyAsync())
        {
            context.Departments.AddRange(
                new Department { Name = "HR" },
                new Department { Name = "IT" },
                new Department { Name = "Finance" },
                new Department { Name = "Sales" }
            );
        }

        if (!await context.Positions.AnyAsync())
        {
            context.Positions.AddRange(
                new Position { Name = "HR Manager" },
                new Position { Name = "Software Engineer" },
                new Position { Name = "QA Engineer" },
                new Position { Name = "Accountant" }
            );
        }

        if (!await context.Shifts.AnyAsync())
        {
            context.Shifts.AddRange(
                new Shift { Name = "Sáng", StartTime = new TimeSpan(8,0,0), EndTime = new TimeSpan(12,0,0), GraceMinutes = 10 },
                new Shift { Name = "Chiều", StartTime = new TimeSpan(13,0,0), EndTime = new TimeSpan(17,0,0), GraceMinutes = 10 }
            );
        }

        if (!await context.LeaveTypes.AnyAsync())
        {
            context.LeaveTypes.AddRange(
                new LeaveType { Name = "Phép năm", Paid = true },
                new LeaveType { Name = "Ốm đau", Paid = true },
                new LeaveType { Name = "Không lương", Paid = false },
                new LeaveType { Name = "Công tác", Paid = true }
            );
        }

        if (!await context.Holidays.AnyAsync())
        {
            context.Holidays.AddRange(
                new Holiday { Date = new DateTime(DateTime.Now.Year, 1, 1), Name = "Tết Dương lịch" },
                new Holiday { Date = new DateTime(DateTime.Now.Year, 4, 30), Name = "Giải phóng miền Nam" },
                new Holiday { Date = new DateTime(DateTime.Now.Year, 5, 1), Name = "Quốc tế Lao động" },
                new Holiday { Date = new DateTime(DateTime.Now.Year, 9, 2), Name = "Quốc khánh" }
            );
        }

        await context.SaveChangesAsync();
    }
}
