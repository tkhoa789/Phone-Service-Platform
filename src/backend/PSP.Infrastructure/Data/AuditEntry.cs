using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Infrastructure.Data;

/// <summary>
/// Lớp trung gian giúp gom nhóm dữ liệu thay đổi của một thực thể (Entity)
/// trước khi chuyển thành đối tượng lưu trữ AuditLogEntity chính thức.
/// </summary>
public class AuditEntry
{
    public AuditEntry(EntityEntry entry)
    {
        Entry = entry;
    }

    public EntityEntry Entry { get; }
    public Guid UserId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = "UPDATE"; // Mặc định là cập nhật
    public Guid? EntityId { get; set; }
    public Dictionary<string, object?> OldValues { get; } = new();
    public Dictionary<string, object?> NewValues { get; } = new();

    /// <summary>
    /// Chuyển đổi dữ liệu gom nhóm thành thực thể AuditLogEntity để lưu vào Database.
    /// </summary>
    public AuditLogEntity ToAuditLog()
    {
        return new AuditLogEntity
        {
            UserId = UserId,
            Action = Action,
            EntityName = TableName,
            EntityId = EntityId,
            OldValue = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues),
            NewValue = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues),
            CreatedAt = DateTime.UtcNow
        };
    }
}
