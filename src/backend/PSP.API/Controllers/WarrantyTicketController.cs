using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Application.Modules.Warranty.DTOs;
using PSP.Application.Modules.Warranty.Queries;
using PSP.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các Phiếu tiếp nhận bảo hành (WarrantyTickets).
/// </summary>
[Authorize(Policy = Permissions.Warranty.View)]
[Route("api/[controller]")]
[Tags("WarrantyTickets")]
public class WarrantyTicketController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu tiếp nhận bảo hành (Warranty.CREATE).
    /// POST: /api/WarrantyTicket
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarrantyTicketCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Lập phiếu tiếp nhận bảo hành thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái bảo hành (Warranty.UPDATE).
    /// PUT: /api/WarrantyTicket/{id}/status
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Update)]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateWarrantyStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật tiến trình bảo hành thành công"));
    }

    /// <summary>
    /// Nhánh 1: Từ chối bảo hành (Warranty.UPDATE).
    /// POST: /api/WarrantyTicket/{id}/reject
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Update)]
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectWarrantyCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Từ chối bảo hành thành công"));
    }

    /// <summary>
    /// Nhánh 2: Chuyển sửa chữa nội bộ In-house (Warranty.UPDATE).
    /// POST: /api/WarrantyTicket/{id}/transfer-repair
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Update)]
    [HttpPost("{id:guid}/transfer-repair")]
    public async Task<IActionResult> TransferToInHouseRepair(Guid id, [FromBody] TransferToInHouseRepairCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<Guid>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Chuyển sửa chữa nội bộ thành công"));
    }

    /// <summary>
    /// Nhánh 3: Đổi máy mới 1-1 theo chuẩn BR-905 (Warranty.UPDATE).
    /// POST: /api/WarrantyTicket/{id}/replace-device
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Update)]
    [HttpPost("{id:guid}/replace-device")]
    public async Task<IActionResult> ReplaceDevice(Guid id, [FromBody] ReplaceDeviceCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Đổi máy mới 1-1 thành công"));
    }

    /// <summary>
    /// Nhánh 4: Gửi máy sang Trung tâm bảo hành Hãng OEM RMA (Warranty.UPDATE).
    /// POST: /api/WarrantyTicket/{id}/send-vendor
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Update)]
    [HttpPost("{id:guid}/send-vendor")]
    public async Task<IActionResult> SendToVendor(Guid id, [FromBody] SendToVendorCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Gửi máy sang trung tâm bảo hành hãng thành công"));
    }

    /// <summary>
    /// Bước hoàn tất: Bàn giao máy trả khách (Warranty.UPDATE).
    /// POST: /api/WarrantyTicket/{id}/deliver
    /// </summary>
    [Authorize(Roles = $"{CanonicalRoles.Owner},{CanonicalRoles.Admin},{CanonicalRoles.Manager},{CanonicalRoles.Warranty},{CanonicalRoles.Sales}")]
    [HttpPost("{id:guid}/deliver")]
    public async Task<IActionResult> DeliverToCustomer(Guid id, [FromBody] DeliverToCustomerCommand command, CancellationToken cancellationToken)
    {
        if (id != command.WarrantyTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu bảo hành trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Bàn giao thiết bị trả khách thành công"));
    }


    /// <summary>
    /// API Xóa mềm phiếu tiếp nhận bảo hành (Warranty.CANCEL - Owner, Admin, Manager).
    /// DELETE: /api/WarrantyTicket/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Warranty.Cancel)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] DeleteWarrantyTicketRequest? request, CancellationToken cancellationToken)
    {
        if (request != null && request.Id != Guid.Empty && id != request.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }
        var rowVersion = request?.RowVersion ?? Array.Empty<byte>();
        var command = new DeleteWarrantyTicketCommand(id, rowVersion);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa phiếu bảo hành thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin phiếu bảo hành kèm toàn bộ lịch sử xử lý.
    /// GET: /api/WarrantyTicket/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetWarrantyTicketByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<WarrantyTicketDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách phiếu bảo hành có hỗ trợ lọc và phân trang.
    /// GET: /api/WarrantyTicket
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] GetWarrantyTicketsQuery query, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        return Ok(new
        {
            success = true,
            message = "Lấy danh sách phiếu bảo hành thành công",
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
    /// API Tra cứu thời hạn bảo hành của thiết bị qua số IMEI (Còn hạn hay Hết hạn 12 tháng).
    /// GET: /api/WarrantyTicket/check/{imei}
    /// </summary>
    [AllowAnonymous]
    [HttpGet("check/{imei}")]
    public async Task<IActionResult> CheckWarranty(string imei, CancellationToken cancellationToken)
    {
        var query = new CheckWarrantyStatusQuery(imei);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<WarrantyCheckResultDto>.Success(result, "Tra cứu thông tin bảo hành thành công"));
    }
}
