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
    public class HolidaysController : ControllerBase
    {
        private readonly HrDbContext _db;
        public HolidaysController(HrDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _db.Holidays.OrderBy(x => x.Date).ToListAsync());

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Holiday dto)
        {
            dto.Id = Guid.NewGuid();
            _db.Holidays.Add(dto);
            await _db.SaveChangesAsync();
            return Ok(dto);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var e = await _db.Holidays.FindAsync(id);
            if (e == null) return NotFound();
            _db.Holidays.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
