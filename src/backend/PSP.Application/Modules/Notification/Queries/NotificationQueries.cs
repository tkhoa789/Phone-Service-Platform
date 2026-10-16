using MediatR;
using PSP.Application.Modules.Notification.DTOs;

namespace PSP.Application.Modules.Notification.Queries;

// Notification Queries
public record GetMyNotificationsQuery(
    int PageIndex = 1,
    int PageSize = 10
) : IRequest<(IEnumerable<NotificationDto> Items, int TotalCount)>;

public record GetUnreadNotificationCountQuery : IRequest<int>;

public record GetTrashNotificationsQuery(
    int PageIndex = 1,
    int PageSize = 20
) : IRequest<(IEnumerable<NotificationDto> Items, int TotalCount)>;

// FileAttachment Queries
public record GetFileAttachmentsByEntityQuery(
    string EntityName,
    Guid EntityId
) : IRequest<IEnumerable<FileAttachmentDto>>;
