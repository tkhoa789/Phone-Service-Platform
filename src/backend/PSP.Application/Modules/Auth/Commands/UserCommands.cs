using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Auth.Commands;

public record CreateUserCommand(
    Guid BranchId,
    string Username,
    string Password, // Sẽ được băm (hash) ở Handler
    string FullName,
    string Email,
    string Phone,
    UserStatus Status
) : IRequest<Guid>;

public record UpdateUserCommand(
    Guid Id,
    Guid BranchId,
    string FullName,
    string Email,
    string Phone,
    UserStatus Status
) : IRequest<bool>;

public record DeleteUserCommand(Guid Id) : IRequest<bool>;
