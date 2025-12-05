// HrSystem.Domain/Entities/OfficeLocation.cs
using System;

namespace HrSystem.Domain.Entities
{
    public class OfficeLocation
    {
        public Guid Id { get; set; }

        // Tên địa điểm (ví dụ: Văn phòng chính)
        public string Name { get; set; } = string.Empty;

        // Địa chỉ hiển thị cho nhân viên
        public string Address { get; set; } = string.Empty;

        // Tọa độ trên bản đồ
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        /// <summary>
        /// Bán kính cho phép chấm công (mét)
        /// </summary>
        public int RadiusMeters { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
