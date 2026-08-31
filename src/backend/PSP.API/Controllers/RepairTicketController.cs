using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.API.Attributes;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Repair.Commands;
using PSP.Application.Modules.Repair.DTOs;
using PSP.Application.Modules.Repair.Queries;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quáº£n lÃ½ cÃ¡c Phiáº¿u sá»­a chá»¯a thiáº¿t bá»‹ dá»‹ch vá»¥ (RepairTickets).
/// 
/// DÃ nh cho ngÆ°á» i má»›i há» c vÃ  trÃ¬nh Ä‘á»™ dÆ°á»›i junior:
/// - Lá»›p nÃ y cung cáº¥p cÃ¡c endpoint tiáº¿p nháº­n thiáº¿t bá»‹, xuáº¥t linh kiá»‡n thay tháº¿, cáº­p nháº­t tiáº¿n Ä‘á»™ tráº¡ng thÃ¡i vÃ  tra cá»©u lá»‹ch sá»­ sá»­a chá»¯a.
/// - CÃ¡c logic nghiá»‡p vá»¥ Ä‘Æ°á»£c Ä‘Ã³ng gÃ³i hoÃ n toÃ n trong táº§ng Application vÃ  Ä‘iá» u phá»‘i qua MediatR.
/// </summary>
[Authorize]
[Route("api/[controller]")]
[Tags("RepairTickets")]
public class RepairTicketController : BaseApiController
{
    /// <summary>
    /// API Táº¡o má»›i Phiáº¿u sá»­a chá»¯a (Tiáº¿p nháº­n mÃ¡y lá»—i cá»§a khÃ¡ch).
    /// POST: /api/RepairTicket
    /// </summary>
    [Authorize(Roles = "Manager,Technician,Receptionist")]
    [HttpPost]
    [Idempotent]
    public async Task<IActionResult> Create([FromBody] CreateRepairTicketCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Láº­p phiáº¿u tiáº¿p nháº­n sá»­a chá»¯a thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Xuáº¥t/thÃªm linh kiá»‡n thay tháº¿ cho phiáº¿u sá»­a chá»¯a.
    /// POST: /api/RepairTicket/part
    /// </summary>
    [Authorize(Roles = "Manager,Technician")]
    [HttpPost("{id}/parts")]
    [Idempotent]
    public async Task<IActionResult> AddPart(Guid id, [FromBody] AddRepairPartCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Xuáº¥t linh kiá»‡n thay tháº¿ thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Táº¡o má»›i BiÃªn báº£n kiá»ƒm tra tÃ¬nh tráº¡ng mÃ¡y (Checklist 8-point).
    /// POST: /api/RepairTicket/checklist
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales,Technician")]
    [HttpPost("checklist")]
    public async Task<IActionResult> CreateChecklist([FromBody] CreateRepairChecklistCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "LÆ°u biÃªn báº£n kiá»ƒm tra thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Cáº­p nháº­t tráº¡ng thÃ¡i phiáº¿u sá»­a chá»¯a (Received -> Diagnosing -> ... -> Completed / Cancelled).
    /// PUT: /api/RepairTicket/{id}/status
    /// </summary>
    [Authorize(Roles = "Manager,Technician,Receptionist")]
    [HttpPut("{id}/status")]
    [Idempotent]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRepairStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiáº¿u trong URL vÃ  body khÃ´ng khá»›p."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cáº­p nháº­t tráº¡ng thÃ¡i sá»­a chá»¯a thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API XÃ³a má» m phiáº¿u sá»­a chá»¯a (Chá»‰ cho phÃ©p khi á»Ÿ tráº¡ng thÃ¡i Received vÃ  chÆ°a xuáº¥t linh kiá»‡n).
    /// DELETE: /api/RepairTicket/{id}
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteRepairTicketCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "XÃ³a phiáº¿u sá»­a chá»¯a thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Láº¥y thÃ´ng tin chi tiáº¿t má»™t phiáº¿u sá»­a chá»¯a kÃ¨m linh kiá»‡n thay tháº¿ vÃ  lá»‹ch sá»­ tráº¡ng thÃ¡i.
    /// GET: /api/RepairTicket/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRepairTicketByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<RepairTicketDto>.Success(result));
    }

    /// <summary>
    /// API Láº¥y danh sÃ¡ch phiáº¿u sá»­a chá»¯a cÃ³ há»— trá»£ lá» c vÃ  phÃ¢n trang.
    /// GET: /api/RepairTicket
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] GetRepairTicketsQuery query, CancellationToken cancellationToken)
    {
        // Nháº­n Query parameters trá»±c tiáº¿p tá»« URL query string
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        
        // Tráº£ vá»  kÃ¨m metadata phÃ¢n trang Ä‘á»ƒ frontend dá»… xá»­ lÃ½
        return Ok(new
        {
            success = true,
            message = "Láº¥y danh sÃ¡ch phiáº¿u sá»­a chá»¯a thÃ nh cÃ´ng",
            data = items,
            pagination = new
            {
                pageIndex = query.PageIndex,
                pageSize = query.PageSize,
                totalCount = totalCount
            }
        });
    }

    /// <summary>
    /// API Thu tiá» n cá» c cho phiáº¿u sá»­a chá»¯a (Chá»‰ thu Ä‘Æ°á»£c khi phiáº¿u chÆ°a hoÃ n thÃ nh/há»§y).
    /// POST: /api/RepairTicket/{id}/deposit
    /// </summary>
    [Authorize(Roles = "Manager,Receptionist")]
    [HttpPost("{id}/deposits")]
    [Idempotent]
    public async Task<IActionResult> CreateDeposit(Guid id, [FromBody] CreateRepairDepositCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiáº¿u trong URL vÃ  body khÃ´ng khá»›p."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Thu tiá»n cá»c thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API HoÃ n tráº£ tiá»n cá»c cho khÃ¡ch hÃ ng (thÆ°á»ng dÃ¹ng khi Há»§y phiáº¿u).
    /// POST: /api/RepairTicket/deposit/{depositId}/refund
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpPost("deposit/{depositId:guid}/refund")]
    public async Task<IActionResult> RefundDeposit(Guid depositId, CancellationToken cancellationToken)
    {
        var command = new RefundRepairDepositCommand(depositId);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "HoÃ n tráº£ tiá»n cá»c thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Cập nhật trạng thái linh kiện thay thế (Issue / Install).
    /// PUT: /api/RepairTicket/{id}/part/{partId}/status
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Technician")]
    [HttpPut("{id:guid}/part/{partId:guid}/status")]
    public async Task<IActionResult> UpdatePartStatus(Guid id, Guid partId, [FromBody] UpdateRepairPartStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái linh kiện thành công"));
    }

    /// <summary>
    /// API Hoàn trả linh kiện (Return).
    /// POST: /api/RepairTicket/{id}/part/{partId}/return
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Technician")]
    [HttpPost("{id:guid}/part/{partId:guid}/return")]
    public async Task<IActionResult> ReturnPart(Guid id, Guid partId, [FromBody] ReturnRepairPartCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn trả linh kiện thành công"));
    }

    /// <summary>
    /// API Ghi nhận hỏng/mất linh kiện (Write-Off).
    /// POST: /api/RepairTicket/{id}/part/{partId}/writeoff
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpPost("{id:guid}/part/{partId:guid}/writeoff")]
    public async Task<IActionResult> WriteOffPart(Guid id, Guid partId, [FromBody] WriteOffRepairPartCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Ghi nhận Write-Off linh kiện thành công"));
    }

    /// <summary>
    /// API Hủy phiếu sửa chữa kèm quyết định xử lý linh kiện (Cancel with Dispositions).
    /// POST: /api/RepairTicket/{id}/cancel
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelTicket(Guid id, [FromBody] CancelRepairTicketCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy phiếu sửa chữa thành công"));
    }
}

