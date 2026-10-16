using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.DTOs;
using PSP.Application.Modules.Inventory.Queries;
using PSP.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER tiếp nhận các yêu cầu HTTP liên quan đến Kho hàng (Warehouses).
/// </summary>
[Authorize(Policy = Permissions.Warehouse.View)]
[Route("api/[controller]")]
[Tags("Warehouses")]
public class WarehouseController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Kho hàng (Warehouse.CREATE - Owner, Admin).
    /// POST: /api/Warehouse
    /// </summary>
    [Authorize(Policy = Permissions.Warehouse.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo kho hàng thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin Kho hàng (Warehouse.UPDATE).
    /// PUT: /api/Warehouse/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Warehouse.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không trùng khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật kho hàng thành công"));
    }

    /// <summary>
    /// API Xóa kho hàng (Warehouse.DELETE - Owner, Admin).
    /// DELETE: /api/Warehouse/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Warehouse.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteWarehouseCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa kho hàng thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Kho hàng theo ID.
    /// GET: /api/Warehouse/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<WarehouseDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả Kho hàng trong hệ thống.
    /// GET: /api/Warehouse
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetWarehousesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<WarehouseDto>>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách các Kho hàng thuộc về một chi nhánh cụ thể.
    /// GET: /api/Warehouse/branch/{branchId}
    /// </summary>
    [HttpGet("branch/{branchId:guid}")]
    public async Task<IActionResult> GetByBranchId(Guid branchId, CancellationToken cancellationToken)
    {
        var query = new GetWarehousesByBranchIdQuery(branchId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<WarehouseDto>>.Success(result));
    }
}
