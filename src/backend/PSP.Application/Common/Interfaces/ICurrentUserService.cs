namespace PSP.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Username { get; }
    string? BranchId { get; }
    bool IsInRole(string role);
    bool IsGlobalAdmin { get; }
}
