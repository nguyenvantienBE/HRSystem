// HrSystem.Api/Contracts/Admin/UserWithRolesDto.cs
using System.Collections.Generic;

namespace HrSystem.Api.Contracts.Admin
{
    public class UserWithRolesDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; } = new();
    }
}
