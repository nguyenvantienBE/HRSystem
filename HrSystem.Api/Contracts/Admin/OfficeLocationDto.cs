using System;

namespace HrSystem.Api.Contracts.Admin
{
    public class OfficeLocationDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        /// <summary>Bán kính cho phép chấm công (mét).</summary>
        public int RadiusMeters { get; set; }

        public bool IsActive { get; set; }
    }

    public class UpsertOfficeLocationRequest
    {
        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public int RadiusMeters { get; set; }
    }
}
