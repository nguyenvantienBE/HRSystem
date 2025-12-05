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
    public class ShiftsController : ControllerBase
    {
        private readonly HrDbContext _db;
        public ShiftsController(HrDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() 
            => Ok(await _db.Shifts.OrderBy(x => x.StartTime).ToListAsync());

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id) => Ok(await _db.Shifts.FindAsync(id));

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Shift dto)
        {
            dto.Id = Guid.NewGuid();
            _db.Shifts.Add(dto);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Shift dto)
        {
            var e = await _db.Shifts.FindAsync(id);
            if (e == null) return NotFound();
            e.Name = dto.Name; e.StartTime = dto.StartTime; e.EndTime = dto.EndTime;
            e.IsOvernight = dto.IsOvernight; e.GraceMinutes = dto.GraceMinutes;
            e.OtRate = dto.OtRate; e.IsActive = dto.IsActive;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var e = await _db.Shifts.FindAsync(id);
            if (e == null) return NotFound();
            _db.Shifts.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
