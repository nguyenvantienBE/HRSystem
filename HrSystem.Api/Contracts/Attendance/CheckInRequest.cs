// Contracts/Attendance/CheckInRequest.cs
using System;

namespace HrSystem.Api.Contracts.Attendance
{
    public class CheckInRequest
    {
        public Guid? ShiftId { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
