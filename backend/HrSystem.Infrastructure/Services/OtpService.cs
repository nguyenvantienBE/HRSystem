using HrSystem.Domain.Entities;
using HrSystem.Infrastructure.Data;
using HrSystem.Infrastructure.Email;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace HrSystem.Infrastructure.Services
{
    // Interface để Api inject
    public interface IOtpService
    {
        Task SendRegisterOtpAsync(string email);
        Task<bool> VerifyRegisterOtpAsync(string email, string otp);
    }

    public class OtpService : IOtpService
    {
        private readonly HrDbContext _db;
        private readonly IEmailSender _email;

        public OtpService(HrDbContext db, IEmailSender email)
        {
            _db = db;
            _email = email;
        }

        public async Task SendRegisterOtpAsync(string email)
        {
            var now = DateTime.UtcNow;

            var rec = await _db.EmailOtps
                .SingleOrDefaultAsync(x => x.Email == email && x.Purpose == "register" && !x.Verified);

            // chống spam 60s
            if (rec != null && rec.LastSentAtUtc.HasValue &&
                now - rec.LastSentAtUtc.Value < TimeSpan.FromSeconds(60))
                throw new InvalidOperationException("Vui lòng đợi 60 giây trước khi yêu cầu lại OTP.");

            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            var salt = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
            var hash = Hash(code, salt);

            if (rec == null)
            {
                rec = new EmailOtp { Email = email, Purpose = "register" };
                _db.EmailOtps.Add(rec);
            }

            rec.OtpHash = hash;
            rec.Salt = salt;
            rec.ExpiresAtUtc = now.AddMinutes(10);
            rec.AttemptLeft = 5;
            rec.ResendCount += 1;
            rec.LastSentAtUtc = now;

            await _db.SaveChangesAsync();

            await _email.SendAsync(email,
                "Mã OTP đăng ký tài khoản",
                $"<p>Mã OTP của bạn là: <b>{code}</b> (hết hạn sau 10 phút).</p>");
        }

        public async Task<bool> VerifyRegisterOtpAsync(string email, string otp)
        {
            var rec = await _db.EmailOtps
                .SingleOrDefaultAsync(x => x.Email == email && x.Purpose == "register" && !x.Verified);

            if (rec == null) return false;
            if (rec.ExpiresAtUtc < DateTime.UtcNow || rec.AttemptLeft <= 0) return false;

            rec.AttemptLeft--;

            var ok = Hash(otp, rec.Salt) == rec.OtpHash;
            if (ok) rec.Verified = true;

            await _db.SaveChangesAsync();
            return ok;
        }

        private static string Hash(string input, string salt)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input + salt));
            return Convert.ToHexString(bytes);
        }
    }
}
