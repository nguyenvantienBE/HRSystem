namespace HrSystem.Domain.Entities;

public class AttendanceRecord
{
    public Guid Id { get; set; }

    // Khóa & ngày
    public Guid EmployeeId { get; set; }
    public Guid ShiftId { get; set; }
    public DateTime Date { get; set; }              // UTC date (00:00)

    // Giờ chấm thực tế (UTC)
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }

    // Kết quả tính công (phút)
    public int WorkMinutes { get; set; }
    public int LateMinutes { get; set; }
    public int EarlyMinutes { get; set; }
    public int OtMinutes { get; set; }

    public bool IsHoliday { get; set; }
    public string? Note { get; set; }

    // ====== PHẦN MỚI: workflow duyệt & chỉnh tay ======

    /// <summary>
    /// Trạng thái: Pending | Approved | Rejected
    /// </summary>
    public string Status { get; set; } = "Pending";

    public string? ApproverId { get; set; }
    public string? ApproverName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ManagerNote { get; set; }

    /// <summary>
    /// Nếu manager sửa tay: lưu lại giờ manual để trace
    /// </summary>
    public DateTime? ManualCheckIn { get; set; }
    public DateTime? ManualCheckOut { get; set; }
    public string? FixReason { get; set; }
}
