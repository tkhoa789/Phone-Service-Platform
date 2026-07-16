using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.DTOs;
using PSP.Application.Modules.Inventory.Queries;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER tiếp nhận các yêu cầu HTTP liên quan đến Điều chuyển kho giữa các chi nhánh (Warehouse Transfer).
/// </summary>
[Route("api/[controller]")]
[Tags("WarehouseTransfers")]
public class WarehouseTransferController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu điều chuyển kho (Trạng thái mặc định là Pending).
    /// POST: /api/WarehouseTransfer
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseTransferCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo phiếu điều chuyển kho thành công."));
    }

    /// <summary>
    /// API Cập nhật thông tin Phiếu điều chuyển kho (Chỉ áp dụng khi phiếu ở trạng thái Pending).
    /// PUT: /api/WarehouseTransfer/{id}
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseTransferCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật phiếu điều chuyển kho thành công."));
    }

    /// <summary>
    /// API Xuất giao hàng điều chuyển (Pending -> InTransit).
    /// PUT: /api/WarehouseTransfer/{id}/ship
    /// </summary>
    [HttpPut("{id:guid}/ship")]
    public async Task<IActionResult> Ship(Guid id, CancellationToken cancellationToken)
    {
        var command = new ShipWarehouseTransferCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xuất giao hàng điều chuyển thành công (Đang vận chuyển)."));
    }

    /// <summary>
    /// API Hoàn tất nhận hàng điều chuyển kho (InTransit -> Received). Thực hiện trừ kho nguồn và cộng kho đích.
    /// PUT: /api/WarehouseTransfer/{id}/receive
    /// </summary>
    [HttpPut("{id:guid}/receive")]
    public async Task<IActionResult> Receive(Guid id, [FromBody] ReceiveWarehouseTransferCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn tất nhận hàng điều chuyển thành công."));
    }

    /// <summary>
    /// API Hủy phiếu điều chuyển kho.
    /// PUT: /api/WarehouseTransfer/{id}/cancel
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var command = new CancelWarehouseTransferCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy phiếu điều chuyển kho thành công."));
    }

    /// <summary>
    /// API Xóa mềm Phiếu điều chuyển kho (Chỉ áp dụng khi phiếu ở trạng thái Pending).
    /// DELETE: /api/WarehouseTransfer/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteWarehouseTransferCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa phiếu điều chuyển kho thành công."));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Phiếu điều chuyển kho theo ID kèm danh sách chi tiết mặt hàng.
    /// GET: /api/WarehouseTransfer/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseTransferByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<WarehouseTransferDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách phiếu điều chuyển kho kèm các bộ lọc tìm kiếm.
    /// GET: /api/WarehouseTransfer
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? fromWarehouseId, [FromQuery] Guid? toWarehouseId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseTransfersQuery(fromWarehouseId, toWarehouseId, status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<WarehouseTransferDto>>.Success(result));
    }
}
