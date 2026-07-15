using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PSP.Application.Common.Interfaces;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using PSP.Infrastructure.Services.Auth;

namespace PSP.Infrastructure;

/// <summary>
/// =====================================================================
/// ĐĂNG KÝ DỊCH VỤ TẦNG INFRASTRUCTURE
/// =====================================================================
/// 
/// File này chịu trách nhiệm đăng ký (register) tất cả các dịch vụ 
/// thuộc tầng Infrastructure vào hệ thống DI (Dependency Injection).
///
/// Khi ứng dụng khởi chạy, .NET sẽ đọc file này để biết:
///   "Khi ai đó yêu cầu IUnitOfWork, hãy tạo ra một UnitOfWork."
///   "Khi ai đó yêu cầu IPasswordHasher, hãy tạo ra một PasswordHasher."
/// =====================================================================
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ===== 1. ĐĂNG KÝ DATABASE (EF CORE + SQL SERVER) =====
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                builder => builder.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

        // ===== 2. ĐĂNG KÝ REPOSITORY & UNIT OF WORK =====
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // ===== 3. ĐĂNG KÝ CÁC DỊCH VỤ XÁC THỰC =====
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
