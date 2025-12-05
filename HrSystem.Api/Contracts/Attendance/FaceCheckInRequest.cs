// Contracts/Attendance/FaceCheckInRequest.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace HrSystem.Api.Contracts.Attendance
{
    /// <summary>
    /// Request dùng cho check-in/check-out bằng khuôn mặt + GPS.
    /// Embedding sẽ được FE tính bằng face-api.js (hoặc lib tương tự)
    /// rồi gửi lên BE.
    /// </summary>
    public class FaceCheckInRequest
    {
        /// <summary>
        /// Ca làm việc hiện tại (tùy chọn).
        /// Nếu FE không gửi, AttendanceController sẽ tự chọn ca mặc định.
        /// </summary>
        public Guid? ShiftId { get; set; }

        /// <summary>
        /// Vector embedding của khuôn mặt hiện tại (ví dụ 128 hoặc 512 phần tử).
        /// Bắt buộc phải có để so khớp với embedding đã lưu trong Employee.
        /// </summary>
        [Required]
        public float[] Embedding { get; set; } = Array.Empty<float>();

        /// <summary>
        /// Vĩ độ hiện tại (tùy chọn – dùng cho kiểm tra GPS).
        /// </summary>
        public double? Latitude { get; set; }

        /// <summary>
        /// Kinh độ hiện tại (tùy chọn – dùng cho kiểm tra GPS).
        /// </summary>
        public double? Longitude { get; set; }

        /// <summary>
        /// Tên địa điểm / địa chỉ hiển thị (client reverse geocode rồi gửi lên).
        /// </summary>
        public string? LocationName { get; set; }

        /// <summary>
        /// Dành cho phase sau nếu cần gửi ảnh base64 lên để lưu lại.
        /// Hiện tại controller chưa dùng property này.
        /// </summary>
        public string? FaceImageBase64 { get; set; }
    }
}
