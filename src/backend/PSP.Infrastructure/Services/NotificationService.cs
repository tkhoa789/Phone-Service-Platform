using Microsoft.AspNetCore.SignalR;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Modules.Notification.Entities;
using PSP.Infrastructure.Hubs;

namespace PSP.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        IHubContext<NotificationHub> hubContext,
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork)
    {
        _hubContext = hubContext;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> SendToUserAsync(Guid userId, string title, string content, CancellationToken cancellationToken)
    {
        // 1. Lưu thông báo vào Database
        var notification = new NotificationEntity
        {
            UserId = userId,
            Title = title,
            Content = content,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 2. Gửi thông báo real-time qua SignalR Hub
        await _hubContext.Clients.Group(userId.ToString())
            .SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Content,
                notification.IsRead,
                notification.CreatedAt
            }, cancellationToken);

        return notification.Id;
    }

    public async Task BroadcastAsync(string title, string content, CancellationToken cancellationToken)
    {
        // Gửi thông báo đến tất cả người dùng trực tuyến
        await _hubContext.Clients.All
            .SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
    }
}
