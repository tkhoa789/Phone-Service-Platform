using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Auth.DTOs;

public record UserDto
{
    public Guid Id { get; init; }
    public Guid BranchId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public UserStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
}
