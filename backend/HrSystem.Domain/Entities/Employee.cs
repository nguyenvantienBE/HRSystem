using System;
using System.Collections.Generic;

namespace HrSystem.Domain.Entities
{
    public class Employee
    {
        public Guid Id { get; set; }

        public string Code { get; set; } = default!;

        public string FullName { get; set; } = default!;

        public string Email { get; set; } = default!;

        public string? Phone { get; set; }

        public Guid DepartmentId { get; set; }

        public Guid PositionId { get; set; }

        public DateTime JoinDate { get; set; }

        public bool IsActive { get; set; } = true;

        public string? FaceProfileUrl { get; set; }

        public string? FaceEmbedding { get; set; }

        // Lương cơ bản & phụ cấp (có thể null nếu chưa cấu hình)
        public decimal? BaseSalary { get; set; }
        public decimal? Allowance { get; set; }

        public Department? Department { get; set; }

        public Position? Position { get; set; }

        public ICollection<AttendanceRecord> AttendanceRecords { get; set; } =
            new List<AttendanceRecord>();

        public ICollection<LeaveRequest> LeaveRequests { get; set; } =
            new List<LeaveRequest>();
    }
}
