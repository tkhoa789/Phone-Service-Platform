using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PSP.Infrastructure.Data;

namespace PSP.Infrastructure.Jobs;

public interface IIdempotencyCleanupJob
{
    Task CleanupExpiredRecordsAsync(CancellationToken cancellationToken);
}

/// <summary>
/// HANGFIRE BACKGROUND RECURRING JOB: DỌN DẸP BẢN GHI IDEMPOTENCY CŨ.
/// 
/// Chạy định kỳ vào 03:00 AM hàng ngày để quét xóa các bản ghi IdempotencyRecords cũ hơn 7 ngày.
/// Tận dụng Index trên CreatedAt kết hợp với ExecuteDeleteAsync() để:
/// 1. Xóa trực tiếp ở mức SQL Server không cần nạp Entity vào RAM.
/// 2. Sử dụng Index Seek / Range Scan, không gây Exclusive Table Lock (X-Lock), triệt tiêu hoàn toàn Deadlock.
/// </summary>
public class IdempotencyCleanupJob : IIdempotencyCleanupJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<IdempotencyCleanupJob> _logger;

    public IdempotencyCleanupJob(AppDbContext context, ILogger<IdempotencyCleanupJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CleanupExpiredRecordsAsync(CancellationToken cancellationToken)
    {
        var retentionDays = 7;
        var thresholdDate = DateTime.UtcNow.AddDays(-retentionDays);

        _logger.LogInformation("🧹 [Hangfire Job] Bắt đầu dọn dẹp IdempotencyRecords cũ hơn {Days} ngày (Trước {Date})...", 
            retentionDays, thresholdDate);

        try
        {
            var deletedCount = await _context.IdempotencyRecords
                .Where(x => x.CreatedAt < thresholdDate)
                .ExecuteDeleteAsync(cancellationToken);

            _logger.LogInformation("✅ [Hangfire Job] Dọn dẹp hoàn tất. Đã giải phóng {Count} bản ghi Idempotency hết hạn.", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hangfire Job] Lỗi trong quá trình dọn dẹp IdempotencyRecords cũ.");
            throw;
        }
    }
}
