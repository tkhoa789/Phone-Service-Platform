using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Application.Modules.Warranty.DTOs;
using PSP.Application.Modules.Warranty.Queries;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các Phiếu tiếp nhận bảo hành (WarrantyTickets).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này tiếp nhận các yêu cầu bảo hành từ bộ phận chăm sóc khách hàng/kỹ thuật.
/// - Cung cấp tính năng kiểm tra nhanh thời hạn bảo hành của thiết bị dựa trên IMEI, cập nhật trạng thái xử lý và đổi trả thiết bị mới.
/// </summary>
[Authorize]
[Route("api/[controller]")]
[Tags("WarrantyTickets")]
public class WarrantyTicketController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu tiếp nhận bảo hành.
    /// POST: /api/WarrantyTicket
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales,Technician")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarrantyTicketCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Lập phiếu tiếp nhận bảo hành thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái bảo hành (Received -> Processing -> Completed / Rejected / Cancelled).
    /// Hỗ trợ truyền NewImei để đổi máy mới cho khách hàng (BR-905).
    /// PUT: /api/WarrantyTicket/{id}/status
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales,Technician")]
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
    /// API Xóa mềm phiếu tiếp nhận bảo hành (Chỉ cho phép khi ở trạng thái Received).
    /// DELETE: /api/WarrantyTicket/{id}
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromBody] byte[] rowVersion, CancellationToken cancellationToken)
    {
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
    [HttpGet("check/{imei}")]
    public async Task<IActionResult> CheckWarranty(string imei, CancellationToken cancellationToken)
    {
        var query = new CheckWarrantyStatusQuery(imei);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<WarrantyCheckResultDto>.Success(result, "Tra cứu thông tin bảo hành thành công"));
    }
}
