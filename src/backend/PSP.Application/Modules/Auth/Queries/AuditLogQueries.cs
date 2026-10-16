using MediatR;
using PSP.Application.Modules.Auth.DTOs;

namespace PSP.Application.Modules.Auth.Queries;

public record GetAuditLogsQuery(
    int PageIndex = 1,
    int PageSize = 20,
    string? EntityName = null,
    string? Action = null,
    Guid? UserId = null
) : IRequest<(IEnumerable<AuditLogDto> Items, int TotalCount)>;
