using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PSP.Application.Common.Interfaces;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Services;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Infrastructure.BackgroundServices;

/// <summary>
/// DỊCH VỤ CHẠY NỀN AI INSIGHTS (AIInsightsWorker) - PHÂN HỆ HỖ TRỢ (Module 19).
/// 
/// Chạy định kỳ trong nền (ở đây cấu hình tạm thời là quét định kỳ hoặc mỗi 24 giờ).
/// Nhiệm vụ:
/// 1. Tự động kiểm tra mức tồn kho của tất cả sản phẩm tại các chi nhánh.
/// 2. Phát hiện các mặt hàng có tồn kho giảm xuống dưới định mức tối thiểu (Quantity <= MinimumStock).
/// 3. Chuyển thông tin tồn kho thấp qua dịch vụ StoreAssistant để sinh ra đề xuất giải pháp xử lý.
/// 4. Đẩy thông báo thời gian thực (Broadcast) qua SignalR Hub tới tất cả quản lý/admin để xử lý kịp thời.
/// 
/// Thích hợp cho junior/sub-junior tìm hiểu về HostedService trong ASP.NET Core.
/// </summary>
public class AIInsightsWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AIInsightsWorker> _logger;

    public AIInsightsWorker(IServiceProvider serviceProvider, ILogger<AIInsightsWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 AI Insights Background Worker bắt đầu khởi động...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var aiService = scope.ServiceProvider.GetRequiredService<IStoreAssistant>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                    _logger.LogInformation("🔍 Đang tiến hành quét kiểm tra mức tồn kho thấp toàn hệ thống...");

                    // 1. Quét tìm các dòng hàng hóa có số lượng tồn hiện tại nhỏ hơn hoặc bằng định mức an toàn tối thiểu (MinimumStock)
                    var lowStockItems = await dbContext.Inventories
                        .Where(i => i.Quantity <= i.MinimumStock)
                        .Include(i => i.ProductVariant)
                        .Include(i => i.Warehouse)
                        .ToListAsync(stoppingToken);

                    if (lowStockItems.Any())
                    {
                        _logger.LogWarning("⚠️ Phát hiện {Count} sản phẩm có mức tồn kho dưới mức tối thiểu an toàn!", lowStockItems.Count);

                        // 2. Chuyển đổi dữ liệu thô sang cấu trúc tinh giản để gửi làm đầu vào cho StoreAssistant phân tích
                        var simplifiedItems = lowStockItems.Select(item => new
                        {
                            VariantName = item.ProductVariant.Name,
                            Sku = item.ProductVariant.Sku,
                            CurrentQuantity = item.Quantity,
                            MinRequired = item.MinimumStock,
                            Warehouse = item.Warehouse.Name
                        }).ToList();

                        var promptInput = $"Danh sách sản phẩm có tồn kho thấp: {JsonSerializer.Serialize(simplifiedItems)}. Hãy đưa ra nhận định và đề xuất giải pháp chuyển kho/nhập hàng tối ưu.";

                        // 3. Gọi dịch vụ phân tích thông minh StoreAssistant
                        var insightText = await aiService.AnalyzeInsightAsync(promptInput, stoppingToken);

                        // 4. Phát thông báo thời gian thực đến toàn hệ thống cho Admin & Managers biết thông qua SignalR
                        await notificationService.BroadcastAsync("Cảnh báo AI Insights", insightText, stoppingToken);
                        
                        _logger.LogInformation("✅ Đã phát thông báo cảnh báo AI Insights thành công.");
                    }
                    else
                    {
                        _logger.LogInformation("✅ Không phát hiện hàng hóa nào bị tồn dưới mức tối thiểu.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi xảy ra trong quá trình chạy nền AIInsightsWorker.");
            }

            // Chạy định kỳ sau mỗi 24 tiếng (hoặc có thể cấu hình ngắn hơn cho mục đích demo/test)
            _logger.LogInformation("💤 AI Insights Worker tạm nghỉ 24 tiếng.");
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
