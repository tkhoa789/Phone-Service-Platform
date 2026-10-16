using System.Security.Claims;
using PSP.Application.Common.Interfaces;

namespace PSP.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                          ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

    public string? Username => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name) 
                            ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("unique_name");

    public string? BranchId => _httpContextAccessor.HttpContext?.User?.FindFirstValue("BranchId");

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true 
                                && !string.IsNullOrEmpty(UserId);

    public bool IsInRole(string role)
    {
        return _httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
    }

    public string? Role => Roles.FirstOrDefault();

    public IReadOnlyList<string> Roles => _httpContextAccessor.HttpContext?.User?.Claims
        .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
        .Select(c => c.Value)
        .Distinct()
        .ToList() ?? (IReadOnlyList<string>)Array.Empty<string>();

    public bool IsGlobalAdmin => IsInRole("Admin") || IsInRole("Owner");
}
