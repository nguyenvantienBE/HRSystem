// Contracts/Attendance/CheckOutRequest.cs
using System;

namespace HrSystem.Api.Contracts.Attendance
{
    public class CheckOutRequest
    {
        public Guid? ShiftId { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
