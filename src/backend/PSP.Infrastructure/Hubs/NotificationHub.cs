using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace PSP.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier 
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }
        await base.OnConnectedAsync();
    }
}
