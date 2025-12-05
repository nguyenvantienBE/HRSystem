using Microsoft.AspNetCore.Identity;

namespace HrSystem.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = default!;
    public Guid? DepartmentId { get; set; }
    public Guid? PositionId { get; set; }
    public bool IsActive { get; set; } = true;
}
