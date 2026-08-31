using PSP.Domain.Common.Entities;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Domain.Modules.Notification.Entities;

/// <summary>
/// Thông báo hệ thống.
/// Tham chiếu: ERD.md - Section 3.4.
/// </summary>
public class NotificationEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
}

/// <summary>
/// Tệp đính kèm (ảnh sản phẩm, phiếu sửa chữa...).
/// Tham chiếu: ERD.md - Section 3.4.
/// </summary>
public class FileAttachmentEntity : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public int FileSize { get; set; }
}
