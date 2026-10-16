namespace PSP.Application.Modules.Auth.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string Action,
    string EntityName,
    Guid? EntityId,
    string? OldValue,
    string? NewValue,
    DateTime CreatedAt
);
