using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Qdrant.Client;
using PSP.Application.Common.Interfaces;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using PSP.Infrastructure.Idempotency;
using PSP.Infrastructure.Services;
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
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        // ===== 2. ĐĂNG KÝ REPOSITORY & UNIT OF WORK =====
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IIdempotencyService, IdempotencyService>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // ===== 3. ĐĂNG KÝ CÁC DỊCH VỤ XÁC THỰC =====
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IAuthService, AuthService>();

        // ===== 4. ĐĂNG KÝ CÁC DỊCH VỤ HỖ TRỢ (MODULE 17, 18, 19) =====
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IStoreAssistant, StoreAssistant>();
        services.AddHostedService<PSP.Infrastructure.BackgroundServices.AIInsightsWorker>();

        // ===== 5. ĐĂNG KÝ HẠ TẦNG AI & RAG (MODULE 20) =====
        var qdrantUri = new Uri(configuration["AiSettings:QdrantEndpoint"] ?? "http://localhost:6333");
        services.AddSingleton(sp => new QdrantClient(qdrantUri.Host, 6334));

        services.AddScoped<Kernel>(sp =>
        {
#pragma warning disable SKEXP0070, CS0618 // Suppress experimental and obsolete warnings
            var kernelBuilder = Kernel.CreateBuilder();
            var ollamaEndpoint = configuration["AiSettings:OllamaEndpoint"] ?? "http://localhost:11434";
            var modelId = configuration["AiSettings:ModelId"] ?? "qwen2.5:7b";
            var embeddingModelId = configuration["AiSettings:EmbeddingModelId"] ?? "nomic-embed-text";

            kernelBuilder.AddOllamaChatCompletion(
                modelId: modelId,
                endpoint: new Uri(ollamaEndpoint)
            );

            kernelBuilder.AddOllamaTextEmbeddingGeneration(
                modelId: embeddingModelId,
                endpoint: new Uri(ollamaEndpoint)
            );

            return kernelBuilder.Build();
#pragma warning restore SKEXP0070, CS0618
        });

        return services;
    }
}
