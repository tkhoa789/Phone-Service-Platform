namespace PSP.Application.Common.Interfaces;

public interface INotificationService
{
    Task<Guid> SendToUserAsync(Guid userId, string title, string content, CancellationToken cancellationToken);
    Task BroadcastAsync(string title, string content, CancellationToken cancellationToken);
}
