namespace HrSystem.Domain.Entities;

public class LeaveRequest //đơn xin nghỉ phép
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int Days { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending"; // Pending/Approved/Rejected
    public Guid? ApproverId { get; set; }
    public DateTime? DecisionAt { get; set; }
    public string? Note { get; set; }
}
