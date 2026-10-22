using System.Text.Json;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Modules.Idempotency.Entities;
using PSP.Infrastructure.Data;

namespace PSP.Infrastructure.Idempotency;

public class IdempotencyService : IIdempotencyService
{
    private readonly AppDbContext _context;
    
    private string? _identityKey;
    private string? _requestHash;

    public IdempotencyService(AppDbContext context)
    {
        _context = context;
    }

    public void SetCurrentRequest(string identityKey, string requestHash)
    {
        _identityKey = identityKey;
        _requestHash = requestHash;
    }

    public void AttachRecord(object responseDto)
    {
        if (string.IsNullOrEmpty(_identityKey))
        {
            // Nếu endpoint không áp dụng idempotency thì SetCurrentRequest không được gọi, do đó bỏ qua.
            return;
        }

        // Wrap the response in ApiResponse to match the actual controller response format
        var apiResponse = PSP.Application.Common.Models.ApiResponse<object>.Success(responseDto);

        var serializedResponse = JsonSerializer.Serialize(apiResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        // 1. Kiểm tra xem bản ghi đã được Middleware tạo trước đó (ở trạng thái IN_PROGRESS) chưa
        var existingRecord = _context.IdempotencyRecords.Local.FirstOrDefault(x => x.IdentityKey == _identityKey)
            ?? _context.IdempotencyRecords.FirstOrDefault(x => x.IdentityKey == _identityKey);

        if (existingRecord != null)
        {
            // Nếu đã có: Cập nhật đè ResponseBody và Hash (UPDATE) thay vì chèn mới (ADD)
            existingRecord.ResponseBody = serializedResponse;
            existingRecord.RequestHash = _requestHash ?? string.Empty;
            existingRecord.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Nếu chưa có (chạy bình thường trên Redis): Mới thực hiện Add mới
            var record = new IdempotencyRecordEntity
            {
                IdentityKey = _identityKey,
                RequestHash = _requestHash ?? string.Empty,
                ResponseBody = serializedResponse,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.IdempotencyRecords.Add(record);
        }
    }

    public string? GetAttachedRecordBody()
    {
        var localRecord = _context.IdempotencyRecords.Local.FirstOrDefault(x => x.IdentityKey == _identityKey)
            ?? _context.IdempotencyRecords.FirstOrDefault(x => x.IdentityKey == _identityKey);
        return localRecord?.ResponseBody;
    }
}
