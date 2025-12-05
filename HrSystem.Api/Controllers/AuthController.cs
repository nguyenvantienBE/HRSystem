using HrSystem.Infrastructure.Identity;
using HrSystem.Infrastructure.Services; // IOtpService
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HrSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;
        private readonly IOtpService _otpService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config,
            IOtpService otpService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _otpService = otpService;
        }

        // =============== OTP REGISTER ===============

        /// <summary>Yêu cầu gửi OTP đến email để đăng ký</summary>
        [HttpPost("request-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email là bắt buộc" });

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return BadRequest(new { message = "Email đã tồn tại" });

            await _otpService.SendRegisterOtpAsync(dto.Email);
            return Ok(new { message = "Đã gửi OTP" });
        }

        /// <summary>Xác thực OTP và tạo tài khoản Staff</summary>
        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return BadRequest(new { message = "Email đã tồn tại" });

            var ok = await _otpService.VerifyRegisterOtpAsync(dto.Email, dto.Otp);
            if (!ok) return BadRequest(new { message = "OTP không hợp lệ hoặc đã hết hạn" });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                EmailConfirmed = true,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Staff");
            return Ok(new { message = "Tạo tài khoản thành công" });
        }

        // =============== BASIC REGISTER / LOGIN / ME ===============

        /// <summary>Đăng ký (không OTP) – dùng nội bộ/dev</summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (await _userManager.FindByEmailAsync(model.Email) != null)
                return BadRequest(new { message = "Email đã tồn tại" });

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                EmailConfirmed = true,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Staff");
            return Ok(new { message = "Register success" });
        }

        /// <summary>Đăng nhập</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            var passwordOk = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!passwordOk)
                return Unauthorized(new { message = "Invalid email or password" });

            var token = await GenerateJwtToken(user);
            return Ok(new { token });
        }

        /// <summary>Lấy thông tin người dùng từ token</summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Invalid token or email not found" });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Email,
                user.FullName,
                Roles = roles
            });
        }

        // =============== JWT ===============

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var jwt = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresMinutes = int.Parse(jwt["ExpireMinutes"]!);

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // =============== DTOs ===============

    public class RegisterDto
    {
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
    }

    public class LoginDto
    {
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
    }

    public class RequestOtpDto
    {
        public string Email { get; set; } = default!;
    }

    public class VerifyOtpDto
    {
        public string Email { get; set; } = default!;
        public string Otp { get; set; } = default!;
        public string FullName { get; set; } = default!;
        public string Password { get; set; } = default!;
    }
}
