using MediatR;
using PSP.Application.Modules.Auth.DTOs;

namespace PSP.Application.Modules.Auth.Queries;

public record GetUserByIdQuery(Guid Id) : IRequest<UserDto>;

public record GetAllUsersQuery(Guid? BranchId = null) : IRequest<IEnumerable<UserDto>>;
