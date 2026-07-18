using Microsoft.AspNetCore.Mvc;
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
/// API Controller quản lý các Phiếu sửa chữa thiết bị dịch vụ (RepairTickets).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cung cấp các endpoint tiếp nhận thiết bị, xuất linh kiện thay thế, cập nhật tiến độ trạng thái và tra cứu lịch sử sửa chữa.
/// - Các logic nghiệp vụ được đóng gói hoàn toàn trong tầng Application và điều phối qua MediatR.
/// </summary>
[Route("api/[controller]")]
[Tags("RepairTickets")]
public class RepairTicketController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu sửa chữa (Tiếp nhận máy lỗi của khách).
    /// POST: /api/RepairTicket
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRepairTicketCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Lập phiếu tiếp nhận sửa chữa thành công"));
    }

    /// <summary>
    /// API Xuất/thêm linh kiện thay thế cho phiếu sửa chữa.
    /// POST: /api/RepairTicket/part
    /// </summary>
    [HttpPost("part")]
    public async Task<IActionResult> AddPart([FromBody] AddRepairPartCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Xuất linh kiện thay thế thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái phiếu sửa chữa (Received -> WaitingForParts -> Repairing -> Completed / Cancelled).
    /// PUT: /api/RepairTicket/{id}/status
    /// </summary>
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRepairStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái sửa chữa thành công"));
    }

    /// <summary>
    /// API Xóa mềm phiếu sửa chữa (Chỉ cho phép khi ở trạng thái Received và chưa xuất linh kiện).
    /// DELETE: /api/RepairTicket/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteRepairTicketCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa phiếu sửa chữa thành công"));
    }

    /// <summary>
    /// API Lấy thông tin chi tiết một phiếu sửa chữa kèm linh kiện thay thế và lịch sử trạng thái.
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
    /// API Lấy danh sách phiếu sửa chữa có hỗ trợ lọc và phân trang.
    /// GET: /api/RepairTicket
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] GetRepairTicketsQuery query, CancellationToken cancellationToken)
    {
        // Nhận Query parameters trực tiếp từ URL query string
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        
        // Trả về kèm metadata phân trang để frontend dễ xử lý
        return Ok(new
        {
            success = true,
            message = "Lấy danh sách phiếu sửa chữa thành công",
            data = items,
            pagination = new
            {
                pageIndex = query.PageIndex,
                pageSize = query.PageSize,
                totalCount = totalCount
            }
        });
    }
}
