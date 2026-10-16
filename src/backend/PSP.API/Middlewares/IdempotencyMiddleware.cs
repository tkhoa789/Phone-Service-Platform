using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using PSP.API.Attributes;
using PSP.Application.Common.Interfaces;
using StackExchange.Redis;
using Microsoft.EntityFrameworkCore;
using PSP.Infrastructure.Data;

namespace PSP.API.Middlewares;

public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;
    private readonly IConnectionMultiplexer _redis;

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
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency-Key header is missing" });
            return;
        }

        var idempotencyKey = keyValues.ToString();
        var userId = currentUserService.UserId ?? "anonymous";
        var branchId = currentUserService.BranchId ?? "nobranch";

        var identityKey = $"idempotency:{userId}:{branchId}:{idempotencyKey}";
        var requestHash = await ComputeRequestHashAsync(context.Request);

        var redisDb = _redis.GetDatabase();

        var lockAcquired = false;
        try
        {
            lockAcquired = await redisDb.StringSetAsync(identityKey, "IN_PROGRESS|" + requestHash, TimeSpan.FromMinutes(2), When.NotExists);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis connection failed during Idempotency check.");
            context.Response.StatusCode = 503;
            await context.Response.WriteAsJsonAsync(new { Message = "Service Unavailable" });
            return;
        }

        if (!lockAcquired)
        {
            RedisValue redisValue = RedisValue.Null;
            try
            {
                redisValue = await redisDb.StringGetAsync(identityKey);
            }
            catch (Exception) { /* Ignore */ }

            if (redisValue.HasValue)
            {
                var redisStr = redisValue.ToString();
                if (redisStr.StartsWith("IN_PROGRESS|"))
                {
                    var savedHash = redisStr.Substring("IN_PROGRESS|".Length);
                    if (savedHash != requestHash)
                    {
                        context.Response.StatusCode = 409;
                        await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                        return;
                    }
                }
                else if (redisStr != "IN_PROGRESS")
                {
                    // It's a cached response. The format is HASH|BODY
                    var separatorIndex = redisStr.IndexOf('|');
                    if (separatorIndex > 0)
                    {
                        var savedHash = redisStr.Substring(0, separatorIndex);
                        var savedBody = redisStr.Substring(separatorIndex + 1);

                        if (savedHash != requestHash)
                        {
                            context.Response.StatusCode = 409;
                            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                            return;
                        }

                        context.Response.StatusCode = 200;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(savedBody);
                        return;
                    }
                }
            }

            var sqlRecord = await dbContext.IdempotencyRecords.FirstOrDefaultAsync(x => x.IdentityKey == identityKey);
            
            if (sqlRecord != null)
            {
                if (sqlRecord.RequestHash != requestHash)
                {
                    context.Response.StatusCode = 409;
                    await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                    return;
                }

                try
                {
                    await redisDb.StringSetAsync(identityKey, sqlRecord.RequestHash + "|" + sqlRecord.ResponseBody, TimeSpan.FromHours(24));
                }
                catch (Exception) { /* Ignore */ }

                context.Response.StatusCode = 200;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(sqlRecord.ResponseBody);
                return;
            }

            context.Response.StatusCode = 409;
            context.Response.Headers["Retry-After"] = "5";
            await context.Response.WriteAsJsonAsync(new { Message = "Idempotency request already in progress." });
            return;
        }

        var existingSqlRecord = await dbContext.IdempotencyRecords.FirstOrDefaultAsync(x => x.IdentityKey == identityKey);
        if (existingSqlRecord != null)
        {
            if (existingSqlRecord.RequestHash != requestHash)
            {
                context.Response.StatusCode = 409;
                await context.Response.WriteAsJsonAsync(new { Message = "Idempotency key already used for a different payload." });
                return;
            }

            try
            {
                await redisDb.StringSetAsync(identityKey, existingSqlRecord.RequestHash + "|" + existingSqlRecord.ResponseBody, TimeSpan.FromHours(24));
            }
            catch (Exception) { /* Ignore */ }

            context.Response.StatusCode = 200;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(existingSqlRecord.ResponseBody);
            return;
        }

        idempotencyService.SetCurrentRequest(identityKey, requestHash);
        
        try
        {
            await _next(context);

            if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
            {
                var body = idempotencyService.GetAttachedRecordBody();
                if (!string.IsNullOrEmpty(body))
                {
                    try
                    {
                        await redisDb.StringSetAsync(identityKey, requestHash + "|" + body, TimeSpan.FromHours(24));
                    }
                    catch (Exception) { /* Ignore */ }
                }
            }
            else
            {
                try
                {
                    await redisDb.KeyDeleteAsync(identityKey);
                }
                catch (Exception) { /* Ignore */ }
            }
        }
        catch (Exception)
        {
            try
            {
                await redisDb.KeyDeleteAsync(identityKey);
            }
            catch (Exception) { /* Ignore */ }
            throw;
        }
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
