namespace PSP.Application.Modules.Notification.DTOs;

public record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Content,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? DeletedAt = null
);

public record FileAttachmentDto(
    Guid Id,
    string EntityName,
    Guid EntityId,
    string FilePath,
    string? FileType,
    int FileSize,
    DateTime CreatedAt
);
