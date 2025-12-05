using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers.Catalog
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Manager,Admin")]
    public class DepartmentsController : ControllerBase
    {
        private readonly HrDbContext _db;
        public DepartmentsController(HrDbContext db) => _db = db;

        // GET /api/departments?q=...
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? q)
        {
            var query = _db.Departments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                query = query.Where(x => x.Name.Contains(q));
            }

            var items = await query
                .OrderBy(x => x.Name)
                .ToListAsync();

            return Ok(items);
        }

        // GET /api/departments/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var dep = await _db.Departments.FindAsync(id);
            if (dep == null) return NotFound();
            return Ok(dep);
        }

        // POST /api/departments
        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Department dto)
        {
            dto.Id = Guid.NewGuid();
            _db.Departments.Add(dto);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
        }

        // PUT /api/departments/{id}
        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Department dto)
        {
            var dep = await _db.Departments.FindAsync(id);
            if (dep == null) return NotFound();

            dep.Name = dto.Name;
            dep.Description = dto.Description;
            dep.IsActive = dto.IsActive;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/departments/{id}
        // Không cho xoá nếu còn nhân viên thuộc phòng ban này
        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var dep = await _db.Departments.FindAsync(id);
            if (dep == null) return NotFound();

            var hasEmployees = await _db.Employees
                .AnyAsync(e => e.DepartmentId == id);

            if (hasEmployees)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa phòng ban đang có nhân viên."
                });
            }

            _db.Departments.Remove(dep);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
