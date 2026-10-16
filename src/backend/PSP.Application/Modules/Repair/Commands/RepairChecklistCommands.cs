using System;
using System.Collections.Generic;
using MediatR;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Repair.Commands;

public class ChecklistItemDto
{
    public string CheckPointName { get; set; } = string.Empty;
    public bool IsPassed { get; set; } = true;
    public string? IssueDescription { get; set; }
}

public record CreateRepairChecklistCommand(
    Guid RepairTicketId,
    RepairChecklistType Type,
    string? Notes,
    string? CustomerSignatureUrl,
    List<ChecklistItemDto> Items
) : IRequest<Guid>;
