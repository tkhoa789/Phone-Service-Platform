using MediatR;
using PSP.Application.Modules.Branch.DTOs;

namespace PSP.Application.Modules.Branch.Queries;

public record GetBranchByIdQuery(Guid Id) : IRequest<BranchDto>;

public record GetAllBranchesQuery : IRequest<IEnumerable<BranchDto>>;
