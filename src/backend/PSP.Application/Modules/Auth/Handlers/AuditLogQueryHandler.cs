using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Queries;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Application.Modules.Auth.Handlers;

/// <summary>
/// HANDLER xử lý truy vấn thông tin Nhật ký hệ thống (Audit Logs).
/// Tuân thủ quy tắc Clean Architecture: không tham chiếu đến EntityFrameworkCore ở lớp Application.
/// </summary>
public class AuditLogQueryHandler : IRequestHandler<GetAuditLogsQuery, (IEnumerable<AuditLogDto> Items, int TotalCount)>
{
    private readonly IRepository<AuditLogEntity> _auditLogRepository;
    private readonly IRepository<UserEntity> _userRepository;

    public AuditLogQueryHandler(
        IRepository<AuditLogEntity> auditLogRepository,
        IRepository<UserEntity> userRepository)
    {
        _auditLogRepository = auditLogRepository;
        _userRepository = userRepository;
    }

    public async Task<(IEnumerable<AuditLogDto> Items, int TotalCount)> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        // 1. Tải danh sách Audit Logs theo các điều kiện lọc động từ Database
        var logs = await _auditLogRepository.FindAsNoTrackingAsync(log =>
            (string.IsNullOrEmpty(request.EntityName) || log.EntityName == request.EntityName) &&
            (string.IsNullOrEmpty(request.Action) || log.Action == request.Action) &&
            (!request.UserId.HasValue || log.UserId == request.UserId),
            cancellationToken);

        // Sắp xếp giảm dần theo thời gian tạo
        var sortedLogs = logs.OrderByDescending(l => l.CreatedAt).ToList();
        var totalCount = sortedLogs.Count;

        // 2. Thực hiện phân trang trong bộ nhớ để bảo toàn tốc độ
        var pagedLogs = sortedLogs
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        // 3. Nạp danh sách thông tin người dùng liên kết (tránh N+1 SQL queries)
        var userIds = pagedLogs.Select(l => l.UserId).Distinct().ToList();
        var users = await _userRepository.FindAsNoTrackingAsync(u => userIds.Contains(u.Id), cancellationToken);
        var userMap = users.ToDictionary(u => u.Id, u => u.FullName);

        // 4. Ghép nối tên người dùng và ánh xạ sang DTO
        var items = pagedLogs.Select(l => new AuditLogDto(
            l.Id,
            l.UserId,
            userMap.TryGetValue(l.UserId, out var name) ? name : "Hệ thống / Admin",
            l.Action,
            l.EntityName,
            l.EntityId,
            l.OldValue,
            l.NewValue,
            l.CreatedAt
        )).ToList();

        return (items, totalCount);
    }
}
