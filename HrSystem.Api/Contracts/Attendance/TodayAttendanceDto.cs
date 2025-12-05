using System;

namespace HrSystem.Api.Contracts.Attendance
{
    /// <summary>
    /// DTO trả về cho endpoint GET /api/attendance/today
    /// Khớp với FE (attendanceApi.ts -> normalizeToday).
    /// </summary>
    public class TodayAttendanceDto
    {
        /// <summary>
        /// Hôm nay đã có ít nhất 1 bản ghi chấm công chưa.
        /// </summary>
        public bool HasRecord { get; set; }

        /// <summary>
        /// Ca làm hiện tại (nếu xác định được).
        /// </summary>
        public Guid? ShiftId { get; set; }

        /// <summary>
        /// Tên ca (ví dụ: "Ca sáng").
        /// </summary>
        public string? ShiftName { get; set; }

        /// <summary>
        /// Lần check-in đầu tiên trong ngày (UTC).
        /// FE sẽ format lại giờ.
        /// </summary>
        public DateTime? FirstCheckInAt { get; set; }

        /// <summary>
        /// Lần check-out cuối cùng trong ngày (UTC).
        /// </summary>
        public DateTime? LastCheckOutAt { get; set; }

        /// <summary>
        /// Trạng thái tổng thể trong ngày: ví dụ Pending / Approved / Rejected...
        /// Lấy theo bản ghi cuối cùng.
        /// </summary>
        public string? Status { get; set; }
    }
}
