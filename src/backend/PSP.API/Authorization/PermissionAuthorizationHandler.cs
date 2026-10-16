using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using PSP.Domain.Common.Constants;

namespace PSP.API.Authorization;

/// <summary>
/// Evaluates whether the current authenticated user satisfies the requested canonical permission.
/// Derives authorization strictly from server-side claims and role-permission mappings.
/// Client headers and untrusted request payloads are never consulted.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly ILogger<PermissionAuthorizationHandler> _logger;

    public PermissionAuthorizationHandler(ILogger<PermissionAuthorizationHandler> logger)
    {
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // 1. Identity must be authenticated
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Task.CompletedTask;
        }

        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User.FindFirstValue("sub")
                     ?? "Unknown";

        // 2. Primary check: Server-issued "Permission" claim in ClaimsPrincipal (JWT or Auth ticket)
        // Owner and all canonical roles hold their explicit canonical permissions as claims.
        if (context.User.HasClaim("Permission", requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 4. Server-side authoritative fallback: Check canonical permissions assigned to user's canonical roles
        var roles = context.User.Claims
            .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
            .Select(c => c.Value)
            .Distinct();

        foreach (var role in roles)
        {
            var rolePerms = Permissions.GetPermissionsForRole(role);
            if (rolePerms.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        _logger.LogWarning("Access DENIED: User {UserId} lacks permission '{Permission}'", userId, requirement.Permission);
        return Task.CompletedTask;
    }
}
