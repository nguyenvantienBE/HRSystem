using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Infrastructure.Data;

public class HrDbContext : IdentityDbContext<ApplicationUser>
{
    public HrDbContext(DbContextOptions<HrDbContext> options) : base(options) { }

    public DbSet<Department>       Departments       => Set<Department>();
    public DbSet<Position>         Positions         => Set<Position>();
    public DbSet<Shift>            Shifts            => Set<Shift>();
    public DbSet<Holiday>          Holidays          => Set<Holiday>();
    public DbSet<LeaveType>        LeaveTypes        => Set<LeaveType>();
    public DbSet<Employee>         Employees         => Set<Employee>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<LeaveRequest>     LeaveRequests     => Set<LeaveRequest>();
    public DbSet<EmailOtp>         EmailOtps         => Set<EmailOtp>();

    // NEW: bảng lưu vị trí công ty
    public DbSet<OfficeLocation>   OfficeLocations   => Set<OfficeLocation>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ========= Uniques cho danh mục =========
        builder.Entity<Department>()
            .HasIndex(x => x.Name).IsUnique();

        builder.Entity<Position>()
            .HasIndex(x => x.Name).IsUnique();

        builder.Entity<LeaveType>()
            .HasIndex(x => x.Name).IsUnique();

        // ========= Employee =========
        builder.Entity<Employee>()
            .HasIndex(x => x.Code).IsUnique();

        builder.Entity<Employee>()
            .HasIndex(x => x.Email).IsUnique();

        builder.Entity<Employee>()
            .Property(x => x.Code).HasMaxLength(32);

        builder.Entity<Employee>()
            .Property(x => x.FullName).HasMaxLength(256);

        builder.Entity<Employee>()
            .Property(x => x.Email).HasMaxLength(256);

        builder.Entity<Employee>()
            .Property(x => x.Phone).HasMaxLength(32);

        builder.Entity<Employee>()
            .Property<string?>(nameof(Employee.FaceProfileUrl))
            .HasMaxLength(1024);

        builder.Entity<Employee>()
            .Property<string?>(nameof(Employee.FaceEmbedding))
            .HasColumnType("nvarchar(max)");

        // ====== cấu hình lương cơ bản & phụ cấp ======
        builder.Entity<Employee>()
            .Property(e => e.BaseSalary)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Employee>()
            .Property(e => e.Allowance)
            .HasColumnType("decimal(18,2)");

        // ========= AttendanceRecord =========
        builder.Entity<AttendanceRecord>()
            .HasIndex(x => new { x.EmployeeId, x.Date, x.ShiftId });

        builder.Entity<AttendanceRecord>()
            .Property(x => x.Status)
            .HasMaxLength(32)
            .HasDefaultValue("Pending");

        builder.Entity<AttendanceRecord>()
            .Property(x => x.ApproverId)
            .HasMaxLength(64);

        builder.Entity<AttendanceRecord>()
            .Property(x => x.ApproverName)
            .HasMaxLength(128);

        builder.Entity<AttendanceRecord>()
            .Property(x => x.ManagerNote)
            .HasMaxLength(1000);

        builder.Entity<AttendanceRecord>()
            .Property(x => x.FixReason)
            .HasMaxLength(500);

        // ========= LeaveRequest =========
        builder.Entity<LeaveRequest>()
            .Property(l => l.Status)
            .HasMaxLength(32)
            .HasDefaultValue("Pending");

        // ========= OfficeLocation (vị trí công ty) =========
        builder.Entity<OfficeLocation>()
            .Property(o => o.Name)
            .HasMaxLength(256);

        // hay dùng để query nhanh "vị trí đang active"
        builder.Entity<OfficeLocation>()
            .HasIndex(o => o.IsActive);
    }
}
