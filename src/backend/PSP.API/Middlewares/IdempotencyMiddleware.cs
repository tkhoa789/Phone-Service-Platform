using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using PSP.API.Attributes;
using PSP.Application.Common.Interfaces;
using StackExchange.Redis;
using Microsoft.EntityFrameworkCore;
using PSP.Infrastructure.Data;
using PSP.Domain.Modules.Idempotency.Entities;

namespace PSP.API.Middlewares;

/// <summary>
/// MIDDLEWARE BẢO VỆ TÍNH BẤT KHẢ BIẾN (IDEMPOTENCY) CẤP ENTERPRISE.
/// 
/// Kiến trúc 2 tầng (Two-Tier Resilience & Circuit Breaker):
/// - Tầng 1 (Fast-Path): Redis Distributed Lock & Cache (TTL 2 phút In-Progress, 24 giờ Cached Result).
///   Cấu hình Timeout ngắn (250ms) và Circuit Breaker với cổng thăm dò đơn lẻ (Single-Probe Half-Open).
/// - Tầng 2 (Fallback-Path): SQL Server Atomic Lock dựa trên Unique Index của IdempotencyRecords.
///   Đảm bảo bán hàng POS và tiếp nhận sửa chữa hoạt động 100% không ngừng nghỉ khi Redis chết.
/// - Rollback Lock: Tự động giải phóng khóa IN_PROGRESS tức thì khi nghiệp vụ trả về mã lỗi (!2xx).
/// </summary>
public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;
    private readonly IConnectionMultiplexer _redis;

    // Circuit Breaker State Machine
    private const int STATE_CLOSED = 0;
    private const int STATE_OPEN = 1;
    private const int STATE_HALF_OPEN = 2;

    private static int _circuitState = STATE_CLOSED;
    private static DateTime _circuitOpenUntil = DateTime.MinValue;
    private static long _consecutiveFailures = 0;

    public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger, IConnectionMultiplexer redis)
    {
        _next = next;
        _logger = logger;
        _redis = redis;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentUserService currentUserService, IIdempotencyService idempotencyService, AppDbContext dbContext)
    {
        var endpoint = context.GetEndpoint();
        var idempotentAttr = endpoint?.Metadata.GetMetadata<IdempotentAttribute>();

        if (idempotentAttr == null)
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var keyValues))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency-Key header is missing" });
            return;
        }

        var idempotencyKey = keyValues.ToString();
        var userId = currentUserService.UserId ?? "anonymous";
        var branchId = currentUserService.BranchId ?? "nobranch";

        var identityKey = $"idempotency:{userId}:{branchId}:{idempotencyKey}";
        var requestHash = await ComputeRequestHashAsync(context.Request);

        // -----------------------------------------------------------------
        // TẦNG 1: THỬ NGHIỆM FAST-PATH TRÊN REDIS (CÓ CIRCUIT BREAKER BẢO VỆ)
        // -----------------------------------------------------------------
        var shouldTryRedis = ShouldAttemptRedis(out var isProbeRequest);
        var handledByRedis = false;
        var lockAcquiredOnRedis = false;

        IDatabase? redisDb = null;
        if (shouldTryRedis)
        {
            try
            {
                redisDb = _redis.GetDatabase();

                // Cố gắng khóa trên Redis với Timeout tối đa 250ms
                lockAcquiredOnRedis = await redisDb.StringSetAsync(
                    identityKey, 
                    "IN_PROGRESS|" + requestHash, 
                    TimeSpan.FromMinutes(2), 
                    When.NotExists
                ).WaitAsync(TimeSpan.FromMilliseconds(250));

                if (isProbeRequest)
                {
                    RecordRedisSuccess();
                    _logger.LogInformation("✅ [Circuit Breaker] Thăm dò Redis thành công! Mạch đã ĐÓNG lại bình thường (CLOSED).");
                }

                handledByRedis = true;
            }
            catch (Exception ex)
            {
                RecordRedisFailure();
                _logger.LogWarning(ex, "⚠️ [Circuit Breaker] Kết nối Redis thất bại hoặc vượt quá 250ms. Tự động Fast-Failover sang SQL Server Fallback.");
                handledByRedis = false;
                lockAcquiredOnRedis = false;
            }
        }

        // -----------------------------------------------------------------
        // XỬ LÝ NẾU REDIS ĐANG HOẠT ĐỘNG
        // -----------------------------------------------------------------
        if (handledByRedis)
        {
            if (!lockAcquiredOnRedis)
            {
                // Khóa không acquire được -> kiểm tra xem đã có cached response chưa hoặc đang chạy
                RedisValue redisValue = RedisValue.Null;
                try
                {
                    redisValue = await redisDb!.StringGetAsync(identityKey).WaitAsync(TimeSpan.FromMilliseconds(250));
                }
                catch (Exception) { /* Bỏ qua lỗi đọc */ }

                if (redisValue.HasValue)
                {
                    var redisStr = redisValue.ToString();
                    if (redisStr.StartsWith("IN_PROGRESS|"))
                    {
                        var savedHash = redisStr.Substring("IN_PROGRESS|".Length);
                        if (savedHash != requestHash)
                        {
                            context.Response.StatusCode = StatusCodes.Status409Conflict;
                            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                            return;
                        }
                    }
                    else if (redisStr != "IN_PROGRESS")
                    {
                        // Đã có kết quả lưu trữ: định dạng HASH|BODY
                        var separatorIndex = redisStr.IndexOf('|');
                        if (separatorIndex > 0)
                        {
                            var savedHash = redisStr.Substring(0, separatorIndex);
                            var savedBody = redisStr.Substring(separatorIndex + 1);

                            if (savedHash != requestHash)
                            {
                                context.Response.StatusCode = StatusCodes.Status409Conflict;
                                await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                                return;
                            }

                            context.Response.StatusCode = StatusCodes.Status200OK;
                            context.Response.ContentType = "application/json";
                            await context.Response.WriteAsync(savedBody);
                            return;
                        }
                    }
                }

                // Kiểm tra phụ trên SQL Server nếu Redis mất cache
                var sqlRecord = await dbContext.IdempotencyRecords.AsNoTracking().FirstOrDefaultAsync(x => x.IdentityKey == identityKey);
                if (sqlRecord != null && sqlRecord.ResponseBody != "IN_PROGRESS")
                {
                    if (sqlRecord.RequestHash != requestHash)
                    {
                        context.Response.StatusCode = StatusCodes.Status409Conflict;
                        await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                        return;
                    }

                    try
                    {
                        await redisDb!.StringSetAsync(identityKey, sqlRecord.RequestHash + "|" + sqlRecord.ResponseBody, TimeSpan.FromHours(24));
                    }
                    catch (Exception) { /* Bỏ qua lỗi ghi cache */ }

                    context.Response.StatusCode = StatusCodes.Status200OK;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(sqlRecord.ResponseBody);
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status409Conflict;
                context.Response.Headers["Retry-After"] = "5";
                await context.Response.WriteAsJsonAsync(new { Message = "Idempotency request already in progress." });
                return;
            }
        }
        else
        {
            // -----------------------------------------------------------------
            // TẦNG 2: SQL SERVER ATOMIC INSERT LOCK (FALLBACK KHI REDIS CHẾT)
            // -----------------------------------------------------------------
            var fallbackAcquired = await TryAcquireSqlAtomicLockAsync(context, dbContext, identityKey, requestHash);
            if (!fallbackAcquired)
            {
                // Phản hồi đã được xử lý bên trong TryAcquireSqlAtomicLockAsync (200 Cache hoặc 409 Conflict)
                return;
            }
        }

        // Thiết lập context cho IdempotencyService
        idempotencyService.SetCurrentRequest(identityKey, requestHash);

        var isSuccessfulExecution = false;
        try
        {
            await _next(context);

            if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
            {
                isSuccessfulExecution = true;
                var body = idempotencyService.GetAttachedRecordBody();
                if (!string.IsNullOrEmpty(body) && redisDb != null && _redis.IsConnected)
                {
                    try
                    {
                        await redisDb.StringSetAsync(identityKey, requestHash + "|" + body, TimeSpan.FromHours(24)).WaitAsync(TimeSpan.FromMilliseconds(250));
                    }
                    catch (Exception) { /* Bỏ qua lỗi ghi cache */ }
                }
            }
        }
        finally
        {
            // NGUYÊN TẮC HOÀN NGUYÊN (ROLLBACK LOCK):
            // Nếu nghiệp vụ thất bại (mã lỗi 4xx, 5xx hoặc văng Exception),
            // xóa NGAY LẬP TỨC khóa IN_PROGRESS để người dùng sửa thông tin và bấm lại tức thì!
            if (!isSuccessfulExecution)
            {
                await RollbackLockAsync(identityKey, redisDb, dbContext);
            }
        }
    }

    private static async Task<bool> TryAcquireSqlAtomicLockAsync(
        HttpContext context, 
        AppDbContext dbContext, 
        string identityKey, 
        string requestHash)
    {
        // 1. Kiểm tra bản ghi hoàn tất trước đó trong DB
        var existingCompleted = await dbContext.IdempotencyRecords.AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdentityKey == identityKey);

        if (existingCompleted != null)
        {
            if (existingCompleted.RequestHash != requestHash)
            {
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                return false;
            }

            if (existingCompleted.ResponseBody != "IN_PROGRESS")
            {
                context.Response.StatusCode = StatusCodes.Status200OK;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(existingCompleted.ResponseBody);
                return false;
            }

            // Bản ghi bị treo > 2 phút (Stale Lock do Server crash)
            if (existingCompleted.UpdatedAt < DateTime.UtcNow.AddMinutes(-2))
            {
                await dbContext.IdempotencyRecords
                    .Where(x => x.IdentityKey == identityKey && x.ResponseBody == "IN_PROGRESS")
                    .ExecuteDeleteAsync();
            }
            else
            {
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                context.Response.Headers["Retry-After"] = "5";
                await context.Response.WriteAsJsonAsync(new { Message = "Idempotency request already in progress." });
                return false;
            }
        }

        // 2. Thực hiện chèn khóa Atomic Insert-First
        var inProgressRecord = new IdempotencyRecordEntity
        {
            Id = Guid.NewGuid(),
            IdentityKey = identityKey,
            RequestHash = requestHash,
            ResponseBody = "IN_PROGRESS",
            Path = context.Request.Path,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            await dbContext.IdempotencyRecords.AddAsync(inProgressRecord);
            await dbContext.SaveChangesAsync();
            return true; // Khóa thành công, luồng được phép đi tiếp
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            // Bắt lỗi trùng khóa Index do luồng khác chạy cùng mili-giây
            var racedRecord = await dbContext.IdempotencyRecords.AsNoTracking()
                .FirstOrDefaultAsync(x => x.IdentityKey == identityKey);

            if (racedRecord != null)
            {
                if (racedRecord.RequestHash != requestHash)
                {
                    context.Response.StatusCode = StatusCodes.Status409Conflict;
                    await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                    return false;
                }

                if (racedRecord.ResponseBody != "IN_PROGRESS")
                {
                    context.Response.StatusCode = StatusCodes.Status200OK;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(racedRecord.ResponseBody);
                    return false;
                }
            }

            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.Headers["Retry-After"] = "5";
            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency request already in progress." });
            return false;
        }
    }

    private async Task RollbackLockAsync(string identityKey, IDatabase? redisDb, AppDbContext dbContext)
    {
        try
        {
            if (redisDb != null && _redis.IsConnected)
            {
                await redisDb.KeyDeleteAsync(identityKey).WaitAsync(TimeSpan.FromMilliseconds(250));
            }
        }
        catch (Exception) { /* Bỏ qua lỗi Redis */ }

        try
        {
            await dbContext.IdempotencyRecords
                .Where(x => x.IdentityKey == identityKey && x.ResponseBody == "IN_PROGRESS")
                .ExecuteDeleteAsync();

            _logger.LogInformation("🔓 [Rollback Lock] Đã giải phóng ổ khóa IN_PROGRESS cho key {Key}.", identityKey);
        }
        catch (Exception exSql)
        {
            _logger.LogWarning(exSql, "⚠️ Không thể dọn dẹp khóa IN_PROGRESS trên SQL Server.");
        }
    }

    private bool ShouldAttemptRedis(out bool isProbeRequest)
    {
        isProbeRequest = false;

        // 1. Mạch đang CLOSED: Kiểm tra kết nối Redis
        if (_circuitState == STATE_CLOSED)
        {
            if (_redis.IsConnected) return true;

            // Mất kết nối tức thì -> Kích hoạt OPEN trong 30 giây
            _circuitState = STATE_OPEN;
            _circuitOpenUntil = DateTime.UtcNow.AddSeconds(30);
            return false;
        }

        // 2. Mạch đang OPEN: Kiểm tra xem đã qua 30 giây cooldown chưa
        if (_circuitState == STATE_OPEN)
        {
            if (DateTime.UtcNow < _circuitOpenUntil)
            {
                return false; // Vẫn trong cooldown -> đi thẳng SQL Fallback (0ms chờ)
            }

            // Hết 30 giây -> Giành vé thăm dò duy nhất (Single-Probe Gate)
            if (Interlocked.CompareExchange(ref _circuitState, STATE_HALF_OPEN, STATE_OPEN) == STATE_OPEN)
            {
                isProbeRequest = true;
                return true; // Request duy nhất này được phép thử Redis
            }

            return false; // Các request còn lại tiếp tục đi SQL Fallback
        }

        // 3. Mạch đang HALF-OPEN: Request khác đang thăm dò, request này đi SQL Fallback
        return false;
    }

    private static void RecordRedisSuccess()
    {
        Interlocked.Exchange(ref _consecutiveFailures, 0);
        _circuitState = STATE_CLOSED;
    }

    private void RecordRedisFailure()
    {
        var failures = Interlocked.Increment(ref _consecutiveFailures);
        _circuitState = STATE_OPEN;
        _circuitOpenUntil = DateTime.UtcNow.AddSeconds(30);
        _logger.LogWarning("⚡ [Circuit Breaker] Redis thất bại (Lần {Count}). Mạch BẬT OPEN trong 30 giây, chuyển lưu lượng sang SQL Fallback.", failures);
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx)
        {
            return sqlEx.Number == 2601 || sqlEx.Number == 2627;
        }
        return false;
    }

    private static async Task<string> ComputeRequestHashAsync(HttpRequest request)
    {
        request.EnableBuffering();
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(request.Body);
        request.Body.Position = 0;
        return Convert.ToBase64String(hashBytes);
    }
}
