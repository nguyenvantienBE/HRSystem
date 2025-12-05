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
    public class PositionsController : ControllerBase
    {
        private readonly HrDbContext _db;
        public PositionsController(HrDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? q)
        {
            var query = _db.Positions.AsQueryable();
            if (!string.IsNullOrWhiteSpace(q)) query = query.Where(x => x.Name.Contains(q));
            return Ok(await query.OrderBy(x => x.Name).ToListAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id) => Ok(await _db.Positions.FindAsync(id));

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Position dto)
        {
            dto.Id = Guid.NewGuid();
            _db.Positions.Add(dto);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Position dto)
        {
            var e = await _db.Positions.FindAsync(id);
            if (e == null) return NotFound();
            e.Name = dto.Name; e.Description = dto.Description; e.IsActive = dto.IsActive;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var e = await _db.Positions.FindAsync(id);
            if (e == null) return NotFound();
            _db.Positions.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
