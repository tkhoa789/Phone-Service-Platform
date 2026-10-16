using MediatR;

namespace PSP.Application.Modules.Notification.Commands;

// Notification Commands
public record SendNotificationCommand(
    Guid UserId,
    string Title,
    string Content
) : IRequest<Guid>;

public record MarkNotificationAsReadCommand(Guid Id) : IRequest<bool>;

public record MarkAllNotificationsAsReadCommand : IRequest<bool>;

public record DeleteNotificationCommand(Guid Id) : IRequest<bool>;

public record ClearAllNotificationsCommand : IRequest<bool>;

public record PermanentDeleteNotificationCommand(Guid Id) : IRequest<bool>;

public record ClearTrashNotificationsCommand : IRequest<bool>;

// FileAttachment Commands
public record UploadFileAttachmentCommand(
    string EntityName,
    Guid EntityId,
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSize
) : IRequest<Guid>;

public record DeleteFileAttachmentCommand(Guid Id) : IRequest<bool>;
