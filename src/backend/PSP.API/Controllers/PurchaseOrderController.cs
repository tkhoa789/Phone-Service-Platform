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
/// CONTROLLER quản lý các API liên quan đến Phiếu nhập kho (Purchase Orders).
/// </summary>
[Route("api/[controller]")]
[Tags("PurchaseOrders")]
public class PurchaseOrderController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu nhập kho (Trạng thái mặc định là Draft).
    /// POST: /api/PurchaseOrder
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo phiếu nhập kho thành công."));
    }

    /// <summary>
    /// API Cập nhật Phiếu nhập kho (Chỉ áp dụng khi phiếu ở trạng thái Draft).
    /// PUT: /api/PurchaseOrder/{id}
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật phiếu nhập kho thành công."));
    }

    /// <summary>
    /// API Hoàn tất nhập kho (Received - Nhận hàng thành công). Kích hoạt cộng tồn kho và sinh thẻ IMEI.
    /// PUT: /api/PurchaseOrder/{id}/complete
    /// </summary>
    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] CompletePurchaseOrderCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn tất nhận hàng và nhập kho thành công."));
    }

    /// <summary>
    /// API Hủy phiếu nhập kho.
    /// PUT: /api/PurchaseOrder/{id}/cancel
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var command = new CancelPurchaseOrderCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy phiếu nhập kho thành công."));
    }

    /// <summary>
    /// API Xóa mềm Phiếu nhập kho (Chỉ áp dụng khi phiếu ở trạng thái Draft).
    /// DELETE: /api/PurchaseOrder/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePurchaseOrderCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa phiếu nhập kho thành công."));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Phiếu nhập kho theo ID kèm danh sách chi tiết mặt hàng.
    /// GET: /api/PurchaseOrder/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPurchaseOrderByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PurchaseOrderDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách phiếu nhập kho kèm các bộ lọc tìm kiếm.
    /// GET: /api/PurchaseOrder
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? supplierId, [FromQuery] Guid? warehouseId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = new GetPurchaseOrdersQuery(supplierId, warehouseId, status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<PurchaseOrderDto>>.Success(result));
    }
}
