using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace HrSystem.Infrastructure.Email
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; } = default!;
        public int    SmtpPort   { get; set; }
        public string Username   { get; set; } = default!;
        public string Password   { get; set; } = default!;
        public string FromEmail  { get; set; } = default!;
    }

    public interface IEmailSender
    {
        Task SendAsync(string to, string subject, string html);
    }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly EmailSettings _cfg;
        public SmtpEmailSender(IOptions<EmailSettings> options) => _cfg = options.Value;

        public async Task SendAsync(string to, string subject, string html)
        {
            using var client = new SmtpClient(_cfg.SmtpServer, _cfg.SmtpPort)
            {
                Credentials = new NetworkCredential(_cfg.Username, _cfg.Password),
                EnableSsl   = true
            };

            using var msg = new MailMessage(_cfg.FromEmail, to, subject, html) { IsBodyHtml = true };
            await client.SendMailAsync(msg);
        }
    }
}
