using System.Security.Claims;
using System.Text.Json;
using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers.Catalog
{
    [ApiController]
    [Route("api/[controller]")]
    // Staff, Manager, Admin đều được gọi controller này
    [Authorize(Roles = "Staff,Manager,Admin")]
    public class EmployeesController : ControllerBase
    {
        private readonly HrDbContext _db;

        public EmployeesController(HrDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // Helpers
        // =====================================================================

        private string? CurrentEmail()
        {
            // Ưu tiên claim Email
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (!string.IsNullOrWhiteSpace(email))
                return email;

            // Thường username = email => dùng Identity.Name
            var name = User.Identity?.Name;
            if (!string.IsNullOrWhiteSpace(name))
                return name;

            return null;
        }

        private static string NewCode(int next) => $"E{next:0000}";

        /// <summary>
        /// Đảm bảo luôn có 1 bản ghi Employee cho user hiện tại.
        /// Nếu chưa có thì tự tạo mới dựa trên Claims.
        /// </summary>
        private async Task<Employee?> EnsureEmployeeForCurrentUserAsync()
        {
            var email = CurrentEmail();
            if (string.IsNullOrWhiteSpace(email))
                return null;

            // 1) Thử tìm trong bảng Employees
            var emp = await _db.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Email == email);

            if (emp != null)
                return emp;

            // 2) Nếu chưa có → tạo mới dựa trên claims
            var fullName =
                User.FindFirstValue(ClaimTypes.Name) ??
                User.FindFirstValue("fullName") ??
                email;

            var phone =
                User.FindFirstValue(ClaimTypes.MobilePhone) ??
                User.FindFirstValue("phone_number");

            var nextNo = await _db.Employees.CountAsync() + 1;

            emp = new Employee
            {
                Id = Guid.NewGuid(),
                Code = NewCode(nextNo),
                Email = email,
                FullName = fullName,
                Phone = phone,
                JoinDate = DateTime.UtcNow,
                IsActive = true
            };

            _db.Employees.Add(emp);
            await _db.SaveChangesAsync();

            // Load lại kèm Department/Position cho chắc
            return await _db.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Id == emp.Id);
        }

        // =====================================================================
        // GET /api/Employees/me  — dùng cho trang Profile
        // =====================================================================

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cho tài khoản hiện tại." });

            return Ok(new
            {
                emp.Id,
                emp.FullName,
                emp.Email,
                emp.Phone,
                DepartmentName = emp.Department?.Name,
                PositionName = emp.Position?.Name,
                emp.FaceProfileUrl,
                HasFaceEmbedding = !string.IsNullOrEmpty(emp.FaceEmbedding)
            });
        }

        // =====================================================================
        // PUT /api/Employees/me  — nhân viên tự cập nhật hồ sơ cơ bản
        // =====================================================================

        public class UpdateMeDto
        {
            public string FullName { get; set; } = default!;
            public string? Phone { get; set; }
        }

        [HttpPut("me")]
        public async Task<IActionResult> PutMe([FromBody] UpdateMeDto dto)
        {
            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cho tài khoản hiện tại." });

            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest(new { message = "FullName là bắt buộc." });

            emp.FullName = dto.FullName.Trim();
            emp.Phone = dto.Phone?.Trim();

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // =====================================================================
        // POST /api/Employees/me/face — lưu ảnh khuôn mặt (avatar)
        // =====================================================================

        [HttpPost("me/face")]
        [RequestSizeLimit(10_000_000)] // 10MB
        public async Task<IActionResult> UploadMyFace(
            IFormFile photo,
            [FromServices] IWebHostEnvironment env)
        {
            if (photo == null || photo.Length == 0)
                return BadRequest(new { message = "Chưa chọn ảnh." });

            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên hiện tại." });

            var allow = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allow.Contains(photo.ContentType))
                return BadRequest(new { message = "Chỉ chấp nhận JPEG/PNG/WebP." });

            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var facesDir = Path.Combine(webRoot, "uploads", "faces");
            Directory.CreateDirectory(facesDir);

            var ext = Path.GetExtension(photo.FileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

            var fileName = $"{emp.Id:N}-{DateTime.UtcNow.Ticks}{ext}";
            var absPath = Path.Combine(facesDir, fileName);

            using (var stream = System.IO.File.Create(absPath))
                await photo.CopyToAsync(stream);

            var publicUrl = $"/uploads/faces/{fileName}";
            emp.FaceProfileUrl = publicUrl;

            await _db.SaveChangesAsync();

            return Ok(new { url = publicUrl });
        }

        // =====================================================================
        // POST /api/Employees/me/face-embedding — lưu embedding khuôn mặt
        // =====================================================================

        public class FaceEmbeddingDto
        {
            public float[] Embedding { get; set; } = Array.Empty<float>();
        }

        [HttpPost("me/face-embedding")]
        public async Task<IActionResult> SaveMyFaceEmbedding([FromBody] FaceEmbeddingDto dto)
        {
            if (dto.Embedding == null || dto.Embedding.Length == 0)
                return BadRequest(new { message = "Embedding trống." });

            var emp = await EnsureEmployeeForCurrentUserAsync();
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên hiện tại." });

            emp.FaceEmbedding = JsonSerializer.Serialize(dto.Embedding);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã lưu embedding." });
        }

        // =====================================================================
        // CRUD chung cho Manager/Admin
        // =====================================================================

        // GET /api/Employees?q=...
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? q)
        {
            var query = _db.Employees
                .Include(e => e.Department)
                .Include(e => e.Position)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                query = query.Where(x =>
                    x.FullName.Contains(q) ||
                    (x.Email != null && x.Email.Contains(q)));
            }

            var data = await query
                .OrderBy(x => x.FullName)
                .ToListAsync();

            return Ok(data);
        }

        // GET /api/Employees/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var e = await _db.Employees
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (e == null) return NotFound();
            return Ok(e);
        }

        // ================= Payroll settings cho Manager/Admin ==================

        public class UpdatePayrollSettingsDto
        {
            public decimal? BaseSalary { get; set; }
            public decimal? Allowance { get; set; }
        }

        // GET /api/Employees/{id}/payroll-settings
        [Authorize(Roles = "Manager,Admin")]
        [HttpGet("{id:guid}/payroll-settings")]
        public async Task<IActionResult> GetPayrollSettings(Guid id)
        {
            var e = await _db.Employees
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (e == null) return NotFound();

            return Ok(new
            {
                e.Id,
                e.Code,
                e.FullName,
                e.Email,
                e.BaseSalary,
                e.Allowance,
                DepartmentName = e.Department?.Name,
                PositionName = e.Position?.Name
            });
        }

        // PUT /api/Employees/{id}/payroll-settings
        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}/payroll-settings")]
        public async Task<IActionResult> UpdatePayrollSettings(
            Guid id,
            [FromBody] UpdatePayrollSettingsDto dto)
        {
            var e = await _db.Employees.FindAsync(id);
            if (e == null) return NotFound();

            if (dto.BaseSalary.HasValue && dto.BaseSalary.Value < 0)
                return BadRequest(new { message = "BaseSalary phải >= 0." });

            if (dto.Allowance.HasValue && dto.Allowance.Value < 0)
                return BadRequest(new { message = "Allowance phải >= 0." });

            if (dto.BaseSalary.HasValue)
                e.BaseSalary = dto.BaseSalary.Value;

            if (dto.Allowance.HasValue)
                e.Allowance = dto.Allowance.Value;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ====================== CRUD ghi dữ liệu (Manager/Admin) ===============

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Employee dto)
        {
            dto.Id = Guid.NewGuid();
            if (dto.JoinDate == default)
                dto.JoinDate = DateTime.UtcNow;

            _db.Employees.Add(dto);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Employee dto)
        {
            var e = await _db.Employees.FindAsync(id);
            if (e == null) return NotFound();

            e.Code = dto.Code;
            e.FullName = dto.FullName;
            e.Email = dto.Email;
            e.Phone = dto.Phone;
            e.DepartmentId = dto.DepartmentId;
            e.PositionId = dto.PositionId;
            e.JoinDate = dto.JoinDate;
            e.IsActive = dto.IsActive;
            // Không đụng BaseSalary/Allowance ở đây

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var e = await _db.Employees.FindAsync(id);
            if (e == null) return NotFound();

            _db.Employees.Remove(e);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
