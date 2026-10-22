using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Services.Security;

/// <summary>
/// Thực thi dịch vụ ký và kiểm thực chữ ký số HMAC-SHA256 cho Pre-signed URLs.
/// Thiết kế Stateless, Thread-safe, hỗ trợ đăng ký Singleton.
/// </summary>
public class HmacTokenService : IHmacTokenService
{
    private readonly byte[] _secretBytes;
    private const int DefaultTtlMinutes = 30;
    private const int ClockSkewToleranceSeconds = 60;

    public HmacTokenService(IConfiguration configuration)
    {
        var secret = configuration["Hmac:Secret"] 
                     ?? configuration["Jwt:Secret"] 
                     ?? "SuperSecretKeyForPhoneServicePlatform2026_ChangeThisInProduction!";
        
        _secretBytes = Encoding.UTF8.GetBytes(secret);
    }

    public string GenerateSignature(Guid fileId, long expiresUnixTimestamp)
    {
        var payload = $"{fileId:D}:{expiresUnixTimestamp}";
        using var hmac = new HMACSHA256(_secretBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        // Xuất ra 64 ký tự Hex chuỗi thường -> Loại trừ 100% bẫy URL encoding của Base64
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public bool ValidateSignature(Guid fileId, long expiresUnixTimestamp, string signature)
    {
        if (string.IsNullOrWhiteSpace(signature))
            return false;

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        // Dung sai lệch giờ (Clock Skew Tolerance) = 60 giây
        if (now > expiresUnixTimestamp + ClockSkewToleranceSeconds)
            return false;

        var expectedSignature = GenerateSignature(fileId, expiresUnixTimestamp);

        var signatureBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());
        var expectedBytes = Encoding.UTF8.GetBytes(expectedSignature);

        if (signatureBytes.Length != expectedBytes.Length)
            return false;

        // Chống tấn công phân tích thời gian (Timing Attack)
        return CryptographicOperations.FixedTimeEquals(signatureBytes, expectedBytes);
    }

    public string GeneratePreSignedUrl(Guid fileId, TimeSpan? lifetime = null)
    {
        var ttl = lifetime ?? TimeSpan.FromMinutes(DefaultTtlMinutes);
        var expires = DateTimeOffset.UtcNow.Add(ttl).ToUnixTimeSeconds();
        var sig = GenerateSignature(fileId, expires);
        return $"/api/FileAttachment/{fileId}/download?expires={expires}&sig={sig}";
    }
}
