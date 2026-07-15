namespace PSP.Domain.Common.Entities;

/// <summary>
/// Base Entity cho tất cả các thực thể trong hệ thống.
/// Tuân thủ DATABASE_RULE: UUID primary key, Soft Delete, Auditing fields.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
