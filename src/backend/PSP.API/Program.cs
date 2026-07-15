using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using PSP.Application;
using PSP.Infrastructure;
using PSP.API.Middlewares;
using PSP.API.Services;
using PSP.Application.Common.Interfaces;
using PSP.Infrastructure.Data.Seeders;

var builder = WebApplication.CreateBuilder(args);

// =====================================================================
// ĐĂNG KÝ DỊCH VỤ (Services Registration)
// =====================================================================

// Đăng ký Controllers (tầng API)
builder.Services.AddControllers();

// Đăng ký Application Layer (MediatR, FluentValidation, Mapster)
builder.Services.AddApplicationServices();

// Đăng ký Infrastructure Layer (EF Core, Repository, UnitOfWork, Auth Services)
builder.Services.AddInfrastructureServices(builder.Configuration);

// Đăng ký HttpContextAccessor và CurrentUserService
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// =====================================================================
// CẤU HÌNH SWAGGER VỚI JWT AUTHENTICATION
// =====================================================================
// Swashbuckle 10.x + OpenApi v2: namespace đã đổi thành Microsoft.OpenApi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Phone Service Platform API",
        Version = "v1",
        Description = "Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant"
    });

    // Khai báo cơ chế xác thực JWT Bearer trên Swagger UI (nút Authorize)
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT Token vào đây.\n\nVí dụ: eyJhbGciOiJIUzI1NiIs..."
    });

    // Áp dụng JWT cho toàn bộ API trên Swagger (Swashbuckle v10 cần lambda)
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

// =====================================================================
// CẤU HÌNH JWT AUTHENTICATION
// =====================================================================
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret chưa được cấu hình trong appsettings.json!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

// =====================================================================
// KHỞI TẠO ỨNG DỤNG
// =====================================================================
var app = builder.Build();

// Gieo dữ liệu ban đầu (Admin, Roles, Permissions) vào Database
await DatabaseSeeder.SeedAsync(app.Services);

// Kích hoạt Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Phone Service Platform API v1");
    c.DocumentTitle = "PSP API Documentation";
});

// Middleware xử lý lỗi tập trung
app.UseMiddleware<GlobalExceptionMiddleware>();

// Pipeline xác thực: UseAuthentication PHẢI đứng TRƯỚC UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
