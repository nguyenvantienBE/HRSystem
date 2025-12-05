namespace HrSystem.Domain.Entities;

public class LeaveType //loại nghỉ phép
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool Paid { get; set; }
    public bool IsActive { get; set; } = true;
}
