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
    public class LeaveTypesController : ControllerBase
    {
        private readonly HrDbContext _db;
        public LeaveTypesController(HrDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _db.LeaveTypes.OrderBy(x => x.Name).ToListAsync());

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LeaveType dto)
        {
            dto.Id = Guid.NewGuid();
            _db.LeaveTypes.Add(dto);
            await _db.SaveChangesAsync();
            return Ok(dto);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] LeaveType dto)
        {
            var e = await _db.LeaveTypes.FindAsync(id);
            if (e == null) return NotFound();
            e.Name = dto.Name; e.Description = dto.Description; e.Paid = dto.Paid; e.IsActive = dto.IsActive;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var e = await _db.LeaveTypes.FindAsync(id);
            if (e == null) return NotFound();
            _db.LeaveTypes.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
