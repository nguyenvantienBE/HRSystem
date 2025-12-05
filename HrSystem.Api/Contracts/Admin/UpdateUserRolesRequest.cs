// HrSystem.Api/Contracts/Admin/UpdateUserRolesRequest.cs
using System.Collections.Generic;

namespace HrSystem.Api.Contracts.Admin
{
    public class UpdateUserRolesRequest
    {
        public List<string> Roles { get; set; } = new();
    }
}
