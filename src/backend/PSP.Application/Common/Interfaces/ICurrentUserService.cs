namespace PSP.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Username { get; }
    string? BranchId { get; }
    bool IsInRole(string role);
    bool IsGlobalAdmin { get; }

    /// <summary>
    /// Indicates whether the current request is authenticated.
    /// Default implementation checks if UserId is non-empty.
    /// </summary>
    bool IsAuthenticated => !string.IsNullOrEmpty(UserId);

    /// <summary>
    /// The primary canonical role of the current user, or null if unauthenticated.
    /// </summary>
    string? Role => null;

    /// <summary>
    /// All canonical roles assigned to the current user.
    /// </summary>
    IReadOnlyList<string> Roles => Array.Empty<string>();
}
