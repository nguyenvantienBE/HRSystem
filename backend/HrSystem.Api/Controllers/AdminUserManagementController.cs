// HrSystem.Api/Controllers/AdminUserManagementController.cs
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HrSystem.Api.Contracts.Admin;
using HrSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers
{
    /// <summary>
    /// Quản lý phân quyền người dùng – chỉ Admin được truy cập.
    /// Route: /api/admin/user-management/...
    /// </summary>
    [ApiController]
    [Route("api/admin/user-management")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    public class AdminUserManagementController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        // Các role hợp lệ trong hệ thống (theo IdentitySeeder)
        private static readonly string[] AllowedRoles = new[]
        {
            "Admin",
            "Manager",
            "Staff"
        };

        public AdminUserManagementController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        /// <summary>
        /// GET /api/admin/user-management/roles
        /// Trả danh sách role hệ thống (Admin, Manager, Staff).
        /// </summary>
        [HttpGet("roles")]
        [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles()
        {
            // Lấy các role tồn tại trong DB và nằm trong AllowedRoles
            var roles = await _roleManager.Roles
                .Where(r => r.Name != null && AllowedRoles.Contains(r.Name))
                .OrderBy(r => r.Name)
                .ToListAsync();

            var dto = roles.Select(r => new RoleDto
            {
                Name = r.Name ?? string.Empty,
                Description = r.Name switch
                {
                    "Admin"   => "Quản trị hệ thống, toàn quyền.",
                    "Manager" => "Quản lý, duyệt nghỉ, duyệt công.",
                    "Staff"   => "Nhân viên, dùng self-service.",
                    _         => null
                }
            }).ToList();

            return Ok(dto);
        }

        /// <summary>
        /// GET /api/admin/user-management/users
        /// Trả danh sách user + roles để Admin cấu hình.
        /// </summary>
        [HttpGet("users")]
        [ProducesResponseType(typeof(List<UserWithRolesDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users
                .OrderBy(u => u.FullName)
                .ThenBy(u => u.Email)
                .ToListAsync();

            var list = new List<UserWithRolesDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                list.Add(new UserWithRolesDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    IsActive = user.IsActive,
                    Roles = roles.ToList()
                });
            }

            return Ok(list);
        }

        /// <summary>
        /// PUT /api/admin/user-management/users/{id}/roles
        /// Ghi đè lại tập role cho user (Admin/Manager/Staff).
        /// </summary>
        [HttpPut("users/{id}/roles")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserRoles(
            string id,
            [FromBody] UpdateUserRolesRequest request)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            // Chuẩn hoá list role được gửi lên
            var requestedRoles = (request.Roles ?? new List<string>())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct()
                .ToList();

            // Chỉ cho phép role trong AllowedRoles
            var invalid = requestedRoles
                .Where(r => !AllowedRoles.Contains(r))
                .ToList();

            if (invalid.Any())
            {
                return BadRequest(new
                {
                    message = "Có role không hợp lệ.",
                    invalid
                });
            }

            // Đảm bảo các role này tồn tại trong DB
            foreach (var roleName in requestedRoles)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            var currentRoles = await _userManager.GetRolesAsync(user);

            // Chỉ sửa các role trong AllowedRoles, không đụng tới role đặc biệt khác (nếu có)
            var rolesToRemove = currentRoles
                .Where(r => AllowedRoles.Contains(r) && !requestedRoles.Contains(r))
                .ToList();

            var rolesToAdd = requestedRoles
                .Where(r => !currentRoles.Contains(r))
                .ToList();

            if (rolesToRemove.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(new
                    {
                        message = "Không thể xoá một số role.",
                        errors = removeResult.Errors
                    });
                }
            }

            if (rolesToAdd.Any())
            {
                var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
                if (!addResult.Succeeded)
                {
                    return BadRequest(new
                    {
                        message = "Không thể thêm một số role.",
                        errors = addResult.Errors
                    });
                }
            }

            return NoContent();
        }
    }
}
