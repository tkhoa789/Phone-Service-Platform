using Hangfire.Dashboard;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace PSP.API.Filters;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Allow local access
        var isLocal = httpContext.Request.Host.Host == "localhost" || 
                      httpContext.Request.Host.Host == "127.0.0.1";
        
        if (isLocal)
        {
            return true;
        }

        // Require Admin/Owner role for remote access
        var user = httpContext.User;
        if (user.Identity != null && user.Identity.IsAuthenticated)
        {
            return user.IsInRole("Admin") || user.IsInRole("Owner");
        }

        return false;
    }
}
