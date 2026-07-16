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
/// CONTROLLER tiếp nhận các yêu cầu HTTP quản lý Số lượng Tồn kho (Inventory) và Định danh thiết bị (IMEI).
/// </summary>
[Route("api/[controller]")]
[Tags("Inventory")]
public class InventoryController : BaseApiController
{
    /// <summary>
    /// API Lấy danh sách số lượng tồn kho của các biến thể sản phẩm kèm các bộ lọc tùy chọn.
    /// GET: /api/Inventory
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetInventories([FromQuery] Guid? warehouseId, [FromQuery] Guid? productVariantId, [FromQuery] bool? isLowStock, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseInventoriesQuery(warehouseId, productVariantId, isLowStock);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<InventoryDto>>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách các mặt hàng sắp hết (dưới định mức tối thiểu) của một kho hàng cụ thể.
    /// GET: /api/Inventory/low-stock/warehouse/{warehouseId}
    /// </summary>
    [HttpGet("low-stock/warehouse/{warehouseId:guid}")]
    public async Task<IActionResult> GetLowStocks(Guid warehouseId, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseLowStockQuery(warehouseId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<InventoryDto>>.Success(result));
    }

    /// <summary>
    /// API Cập nhật định mức tồn tối thiểu cảnh báo cho một dòng hàng tồn kho.
    /// PUT: /api/Inventory/{id}/min-stock
    /// </summary>
    [HttpPut("{id:guid}/min-stock")]
    public async Task<IActionResult> UpdateMinStock(Guid id, [FromBody] int minimumStock, CancellationToken cancellationToken)
    {
        var command = new UpdateInventoryMinStockCommand(id, minimumStock);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật định mức tồn tối thiểu thành công."));
    }

    /// <summary>
    /// API Tra cứu thông tin chi tiết của một mã số IMEI.
    /// GET: /api/Inventory/imei/{imei}
    /// </summary>
    [HttpGet("imei/{imei}")]
    public async Task<IActionResult> GetImeiDetails(string imei, CancellationToken cancellationToken)
    {
        var query = new GetImeiByNumberQuery(imei);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<ImeiDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách các IMEI kèm bộ lọc tùy chọn.
    /// GET: /api/Inventory/imeis
    /// </summary>
    [HttpGet("imeis")]
    public async Task<IActionResult> GetImeis([FromQuery] Guid? warehouseId, [FromQuery] Guid? productVariantId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = new GetImeisQuery(warehouseId, productVariantId, status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ImeiDto>>.Success(result));
    }

    /// <summary>
    /// API Cập nhật trạng thái vòng đời của một mã số IMEI (InStock, Sold, Repairing, WarrantyHold, Disposed).
    /// PUT: /api/Inventory/imei/{imei}/status
    /// </summary>
    [HttpPut("imei/{imei}/status")]
    public async Task<IActionResult> UpdateImeiStatus(string imei, [FromBody] string status, CancellationToken cancellationToken)
    {
        var command = new UpdateImeiStatusCommand(imei, status);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái IMEI thành công."));
    }
}
