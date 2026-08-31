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

    public bool IsInRole(string role)
    {
        return _httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
    }

    public bool IsGlobalAdmin => IsInRole("Admin") || IsInRole("Owner");
}
