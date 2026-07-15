using MediatR;
using PSP.Application.Modules.Auth.DTOs;

namespace PSP.Application.Modules.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<AuthResponseDto>;
