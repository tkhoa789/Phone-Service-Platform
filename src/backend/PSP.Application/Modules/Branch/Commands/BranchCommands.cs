using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Branch.Commands;

public record CreateBranchCommand(
    string Code,
    string Name,
    string Address,
    string Phone,
    string? Email,
    BranchStatus Status
) : IRequest<Guid>;

public record UpdateBranchCommand(
    Guid Id,
    string Name,
    string Address,
    string Phone,
    string? Email,
    BranchStatus Status
) : IRequest<bool>;

public record DeleteBranchCommand(Guid Id) : IRequest<bool>;
