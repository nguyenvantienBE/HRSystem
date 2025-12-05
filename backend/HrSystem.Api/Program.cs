using System.Text;
using HrSystem.Infrastructure.Data;
using HrSystem.Infrastructure.Email;
using HrSystem.Infrastructure.Identity;
using HrSystem.Infrastructure.Seed;
using HrSystem.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ====================== Serilog ======================
builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

// ====================== Database ======================
builder.Services.AddDbContext<HrDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ====================== Identity ======================
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<HrDbContext>()
    .AddDefaultTokenProviders();

// ====================== JWT ======================
var jwt = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

builder.Services
    .AddAuthentication(o =>
    {
        o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ====================== CORS (FE) ======================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowFE", p => p
        .WithOrigins(
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
    );
});

// ====================== Controllers + Swagger ======================
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HrSystem.Api", Version = "v1" });

    // Tránh lỗi 500 do trùng tên type/route khi build schema
    c.CustomSchemaIds(t => t.FullName);                       // phân biệt theo FullName
    c.ResolveConflictingActions(apiDescs => apiDescs.First()); // nếu lỡ trùng route, lấy cái đầu

    // Bearer auth trên Swagger
    var jwtScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Chỉ dán JWT (không cần 'Bearer ')",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition(jwtScheme.Reference.Id, jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

// ====================== Email & OTP ======================
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IOtpService, OtpService>();

var app = builder.Build();

// ====================== Dev error page (để thấy stack trace thật) ======================
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// ====================== Đảm bảo thư mục tĩnh tồn tại ======================
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "faces")); // ảnh baseline
Directory.CreateDirectory(Path.Combine(webRoot, "models"));           // face-api models nếu dùng local

// ====================== Middlewares (thứ tự quan trọng) ======================
// Swagger ở "/"
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HrSystem.Api v1");
    c.RoutePrefix = string.Empty;
});

app.UseSerilogRequestLogging();

// Chỉ redirect HTTPS khi Production để tránh cảnh báo "Failed to determine the https port..."
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// File tĩnh (uploads/, models/, …)
app.UseStaticFiles();

// CORS phải nằm trước Authentication
app.UseCors("AllowFE");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ====================== Seed dữ liệu ======================
using (var scope = app.Services.CreateScope())
{
    var sp      = scope.ServiceProvider;
    var db      = sp.GetRequiredService<HrDbContext>();
    var userMgr = sp.GetRequiredService<UserManager<ApplicationUser>>();
    var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole>>();

    await db.Database.MigrateAsync();
    await DataSeeder.SeedDataAsync(db);
    await IdentitySeeder.SeedAsync(userMgr, roleMgr);
    await EmployeeSeeder.EnsureEmployeesForUsersAsync(db, userMgr); // đồng bộ User -> Employee nếu thiếu
}

app.Run();
