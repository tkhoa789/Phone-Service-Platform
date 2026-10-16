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
using Hangfire;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// =====================================================================
// ĐĂNG KÝ DỊCH VỤ (Services Registration)
// =====================================================================

// Đăng ký Controllers (tầng API) và cấu hình chuyển đổi Enum sang Chuỗi (String) trong JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Đăng ký Application Layer (MediatR, FluentValidation, Mapster)
builder.Services.AddApplicationServices();

// Đăng ký Infrastructure Layer (EF Core, Repository, UnitOfWork, Auth Services)
builder.Services.AddInfrastructureServices(builder.Configuration);

// Đăng ký HttpContextAccessor và CurrentUserService
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Đăng ký dịch vụ SignalR
builder.Services.AddSignalR();

// =====================================================================
// CẤU HÌNH ENTERPRISE: REDIS CACHE & HANGFIRE BACKGROUND JOBS
// =====================================================================
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "PSP_";
});
builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379"));

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

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
// CẤU HÌNH BẢO MẬT NÂNG CAO: STRICT CORS POLICY WHITELIST
// =====================================================================
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    
    // Fallback to localhost if misconfigured, to prevent complete lockout during dev
    if (allowedOrigins == null || allowedOrigins.Length == 0)
    {
        allowedOrigins = new[] { "http://localhost:3000", "http://localhost:5173" };
    }

    options.AddPolicy("StrictCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// =====================================================================
// CẤU HÌNH BẢO MẬT NÂNG CAO: API RATE LIMITING (CHỐNG BRUTE-FORCE & DDOS)
// =====================================================================
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Giới hạn chung: Tối đa 120 requests/phút cho mỗi kết nối IP
    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 2000,
                Window = TimeSpan.FromMinutes(1)
            });
    });
});

// =====================================================================
// CẤU HÌNH JWT AUTHENTICATION VỚI KIỂM TRA TRẠNG THÁI TÀI KHOẢN REAL-TIME
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

    options.Events = new JwtBearerEvents
    {
        // 1. Hỗ trợ truyền Token qua Query String cho SignalR WebSockets
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },

        // 2. Bảo mật nâng cao: Kiểm tra trạng thái tài khoản Real-time trong Database khi xác thực Token.
        // Nếu Admin khóa tài khoản (Locked/Inactive), Token hiện tại lập tức bị vô hiệu hóa ngay lập tức!
        OnTokenValidated = async context =>
        {
            var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? context.Principal?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                using var scope = context.HttpContext.RequestServices.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<PSP.Infrastructure.Data.AppDbContext>();

                var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                    dbContext.Users, u => u.Id == userId && !u.IsDeleted);

                if (user == null || user.Status != PSP.Domain.Common.Enums.UserStatus.Active)
                {
                    context.Fail("Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động bởi Quản trị viên!");
                }
            }
        }
    };
});

// =====================================================================
// AUTHORIZATION FOUNDATION & PERMISSION MODEL (RBAC-01 / RBAC-02)
// =====================================================================
builder.Services.AddAuthorization();
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider, PSP.API.Authorization.PermissionPolicyProvider>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, PSP.API.Authorization.PermissionAuthorizationHandler>();

// =====================================================================
// KHỞI TẠO ỨNG DỤNG & MIDDLEWARE PIPELINE BẢO MẬT MULTI-LAYERED
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

// Phục vụ tệp tĩnh (ảnh tải lên, attachments, v.v.)
app.UseStaticFiles();

// 1. Middleware Tiêm Security Headers OWASP (Chống Clickjacking, MIME Sniffing, XSS)
app.UseMiddleware<SecurityHeadersMiddleware>();

// 2. Middleware Làm sạch Dữ liệu Đầu vào Anti-XSS (Input Sanitization)
app.UseMiddleware<InputSanitizationMiddleware>();

// 3. Middleware Gắn Correlation ID
app.UseMiddleware<CorrelationIdMiddleware>();

// 4. Middleware Xử lý Lỗi Tập trung
app.UseMiddleware<GlobalExceptionMiddleware>();

// 4. Kích hoạt Strict CORS Policy Whitelist
app.UseCors("StrictCorsPolicy");

// 5. Kích hoạt Rate Limiting (Chống Brute-Force & DDoS)
app.UseRateLimiter();

// 6. Pipeline Xác thực: UseAuthentication PHẢI đứng TRƯỚC UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

// 6.5. Middleware Idempotency (Phải sau Auth để lấy UserId/BranchId)
app.UseMiddleware<IdempotencyMiddleware>();

// 7. Kích hoạt Hangfire Dashboard
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new PSP.API.Filters.HangfireAuthorizationFilter() }
});

app.MapControllers();
app.MapHub<PSP.Infrastructure.Hubs.NotificationHub>("/notificationHub");

app.Run();
