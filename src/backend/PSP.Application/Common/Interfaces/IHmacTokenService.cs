using System;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// Dịch vụ quản lý chữ ký số HMAC-SHA256 phục vụ cấp phát và thẩm định Pre-signed URLs cho tệp đính kèm.
/// </summary>
public interface IHmacTokenService
{
    /// <summary>
    /// Tạo chữ ký số HMAC-SHA256 (dạng chuỗi thường 64 ký tự Hex) cho tệp tại mốc thời gian hết hạn.
    /// </summary>
    string GenerateSignature(Guid fileId, long expiresUnixTimestamp);

    /// <summary>
    /// Thẩm định chữ ký số chống giả mạo, kiểm tra hạn dùng (TTL + Clock Skew Tolerance) bằng Fixed-Time Equals.
    /// </summary>
    bool ValidateSignature(Guid fileId, long expiresUnixTimestamp, string signature);

    /// <summary>
    /// Tạo Pre-signed URL hoàn chỉnh dạng /api/FileAttachment/{id}/download?expires={ts}&sig={hex}
    /// </summary>
    string GeneratePreSignedUrl(Guid fileId, TimeSpan? lifetime = null);
}
