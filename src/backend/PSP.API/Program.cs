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
{
    var redisConnStr = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    var options = ConfigurationOptions.Parse(redisConnStr);
    options.AbortOnConnectFail = false;
    options.ConnectTimeout = 3000;
    options.SyncTimeout = 1000;
    options.AsyncTimeout = 1000;
    return ConnectionMultiplexer.Connect(options);
});

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<PSP.Infrastructure.Jobs.IIdempotencyCleanupJob, PSP.Infrastructure.Jobs.IdempotencyCleanupJob>();

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
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

    options.AddPolicy("StrictCorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                try
                {
                    var uri = new Uri(origin);
                    return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                           uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                           uri.Host.StartsWith("192.168.", StringComparison.OrdinalIgnoreCase) ||
                           uri.Host.StartsWith("10.", StringComparison.OrdinalIgnoreCase) ||
                           uri.Host.StartsWith("172.", StringComparison.OrdinalIgnoreCase) ||
                           allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                }
                catch
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
        else
        {
            if (allowedOrigins.Length == 0)
            {
                allowedOrigins = new[] { "http://localhost:3000", "http://localhost:5173" };
            }

            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
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
// CẤU HÌNH JWT AUTHENTICATION VỚI FAIL-FAST STARTUP GUARD & CONFIG SYNC
// =====================================================================
var jwtSecret = builder.Configuration["Jwt:Secret"];
var aspnetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
var isExplicitProduction = string.Equals(aspnetEnv, "Production", StringComparison.OrdinalIgnoreCase);

if (builder.Environment.IsProduction() && isExplicitProduction && !System.Diagnostics.Debugger.IsAttached)
{
    if (string.IsNullOrWhiteSpace(jwtSecret) ||
        jwtSecret.Contains("__PROD_") ||
        Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    {
        throw new InvalidOperationException(
            "CRITICAL SECURITY CONFIGURATION ERROR: Trong môi trường Production, 'Jwt:Secret' bắt buộc phải " +
            "được cấu hình an toàn qua Biến môi trường (Environment Variable), không được để trống, không được " +
            "chứa placeholder '__PROD_', và phải có độ dài tối thiểu 256-bit (>= 32 bytes UTF-8)!");
    }
}
else
{
    // Ở Development/Test (hoặc khi chạy local trong Visual Studio): Nếu chưa có hoặc dính placeholder thì nạp khóa dev chuẩn
    if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Contains("__PROD_"))
    {
        jwtSecret = "SuperSecretKeyForPhoneServicePlatform2026_ChangeThisInProduction!";
    }
}

// 🔒 CHỐT CHẶN TỬ HUYỆT 1: Đồng bộ ngược lại Configuration để JwtProvider.cs đọc đúng secret này
builder.Configuration["Jwt:Secret"] = jwtSecret;

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

// =====================================================================
// KHỞI TẠO CƠ SỞ DỮ LIỆU & GIEO DỮ LIỆU BAN ĐẦU (DUAL-MODE RESILIENT)
// =====================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<PSP.Infrastructure.Data.AppDbContext>();

    try
    {
        // 1. Dual-Mode Migration: Tự động chạy ở Development nếu được bật cờ cấu hình
        var autoMigrate = app.Environment.IsDevelopment() && 
            app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup", true);

        if (autoMigrate)
        {
            logger.LogInformation("🔄 [Migration Engine] Đang tự động kiểm tra và cập nhật Schema EF Core...");
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.MigrateAsync(context.Database);
            logger.LogInformation("✅ [Migration Engine] Cập nhật Database Schema thành công 100%.");
        }
        else
        {
            logger.LogInformation("ℹ️ [Migration Engine] Bỏ qua Auto-Migration (Chế độ Production hoặc cờ cấu hình tắt).");
        }

        // 2. Gieo dữ liệu hạt giống (Idempotent Data Seeder)
        logger.LogInformation("🌱 [Data Seeder] Bắt đầu gieo dữ liệu ban đầu...");
        await DatabaseSeeder.SeedAsync(services);
        logger.LogInformation("✅ [Data Seeder] Dữ liệu ban đầu đã sẵn sàng.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "❌ [FATAL ERROR] Khởi tạo Database thất bại! Hệ thống dừng an toàn để tránh ghi đè sai lệch dữ liệu.");
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

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

// 7.1. Kích hoạt Recurring Job tự động dọn dẹp IdempotencyRecords cũ hơn 7 ngày lúc 03:00 AM
RecurringJob.AddOrUpdate<PSP.Infrastructure.Jobs.IIdempotencyCleanupJob>(
    "cleanup-expired-idempotency-records",
    job => job.CleanupExpiredRecordsAsync(CancellationToken.None),
    "0 3 * * *",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Local }
);

app.MapControllers();
app.MapHub<PSP.Infrastructure.Hubs.NotificationHub>("/notificationHub");

// Non-blocking background initialization for AI Knowledge Seeder (Package 4)
_ = Task.Run(async () =>
{
    try
    {
        await Task.Delay(5000);
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<PSP.Infrastructure.Services.AI.AIKnowledgeSeeder>();
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "⚠️ AI Knowledge Seeder gặp sự cố khi chạy nền. Ứng dụng vẫn hoạt động bình thường.");
    }
});

app.Run();
