// HrSystem.Api/Controllers/OfficeLocationAdminController.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using HrSystem.Api.Contracts.Admin;
using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/admin/office-location")]
    [Authorize(Roles = "Admin")]
    public class OfficeLocationAdminController : ControllerBase
    {
        private readonly HrDbContext _db;

        public OfficeLocationAdminController(HrDbContext db)
        {
            _db = db;
        }

        // GET api/admin/office-location
        // Lấy vị trí đang active (nếu không có thì trả về null)
        [HttpGet]
        [ProducesResponseType(typeof(OfficeLocationDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActive()
        {
            var loc = await _db.OfficeLocations
                .Where(x => x.IsActive)
                .OrderBy(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (loc == null)
            {
                return Ok(null);
            }

            return Ok(ToDto(loc));
        }

        // PUT api/admin/office-location
        // Tạo hoặc cập nhật vị trí active
        [HttpPut]
        [ProducesResponseType(typeof(OfficeLocationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Upsert([FromBody] UpsertOfficeLocationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.RadiusMeters <= 0)
            {
                return BadRequest(new { message = "RadiusMeters phải lớn hơn 0." });
            }

            var now = DateTime.UtcNow;

            // Chỉ cho phép 1 vị trí active
            var loc = await _db.OfficeLocations
                .Where(x => x.IsActive)
                .OrderBy(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (loc == null)
            {
                loc = new OfficeLocation
                {
                    Id           = Guid.NewGuid(),
                    Name         = request.Name.Trim(),
                    Address      = request.Address.Trim(),
                    Latitude     = request.Latitude,
                    Longitude    = request.Longitude,
                    RadiusMeters = request.RadiusMeters,
                    IsActive     = true,
                    CreatedAt    = now,
                    UpdatedAt    = now
                };

                _db.OfficeLocations.Add(loc);
            }
            else
            {
                loc.Name         = request.Name.Trim();
                loc.Address      = request.Address.Trim();
                loc.Latitude     = request.Latitude;
                loc.Longitude    = request.Longitude;
                loc.RadiusMeters = request.RadiusMeters;
                loc.IsActive     = true;
                loc.UpdatedAt    = now;

                _db.OfficeLocations.Update(loc);
            }

            await _db.SaveChangesAsync();

            return Ok(ToDto(loc));
        }

        private static OfficeLocationDto ToDto(OfficeLocation loc)
        {
            return new OfficeLocationDto
            {
                Id           = loc.Id,
                Name         = loc.Name,
                Address      = loc.Address,
                Latitude     = loc.Latitude,
                Longitude    = loc.Longitude,
                RadiusMeters = loc.RadiusMeters,
                IsActive     = loc.IsActive
            };
        }
    }
}
