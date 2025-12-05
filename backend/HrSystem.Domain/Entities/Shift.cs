namespace HrSystem.Domain.Entities;

public class Shift //ca làm việc
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsOvernight { get; set; }
    public int GraceMinutes { get; set; } = 0;
    public double OtRate { get; set; } = 1.5;
    public bool IsActive { get; set; } = true;
}
