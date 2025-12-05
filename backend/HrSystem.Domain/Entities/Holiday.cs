namespace HrSystem.Domain.Entities;

public class Holiday //ngày nghỉ lễ
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}
