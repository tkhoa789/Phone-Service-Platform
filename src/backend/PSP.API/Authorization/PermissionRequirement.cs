using System;
using Microsoft.AspNetCore.Authorization;

namespace PSP.API.Authorization;

/// <summary>
/// Authorization requirement representing a specific canonical permission.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission ?? throw new ArgumentNullException(nameof(permission));
    }
}
