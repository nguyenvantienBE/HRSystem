using System.ComponentModel.DataAnnotations;

namespace HrSystem.Domain.Entities
{
    public class EmailOtp
    {
        public Guid Id { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = default!;

        // Lưu OTP dưới dạng hash + salt
        [Required] public string OtpHash { get; set; } = default!;
        [Required] public string Salt    { get; set; } = default!;

        // Quản lý vòng đời OTP
        public DateTime ExpiresAtUtc { get; set; }
        public int AttemptLeft { get; set; } = 5;
        public int ResendCount { get; set; } = 0;
        public DateTime? LastSentAtUtc { get; set; }

        // “register” để phân biệt mục đích (sau này có thể dùng “reset-password”)
        [Required] public string Purpose { get; set; } = "register";

        public bool Verified { get; set; } = false;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
