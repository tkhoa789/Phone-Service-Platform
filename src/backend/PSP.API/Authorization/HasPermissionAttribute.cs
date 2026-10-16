using System;
using Microsoft.AspNetCore.Authorization;

namespace PSP.API.Authorization;

/// <summary>
/// Enforces that the authenticated user possesses the specified canonical permission.
/// Usage: [HasPermission(Permissions.Inventory.Adjust)]
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission) : base(policy: permission)
    {
    }
}
