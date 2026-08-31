using Microsoft.AspNetCore.Authorization;
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
/// CONTROLLER tiếp nhận các yêu cầu HTTP liên quan đến Kho hàng (Warehouses).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này đón nhận HTTP Requests từ Client, gọi MediatR gửi Command/Query xuống tầng Application, và bọc kết quả trả về bằng ApiResponse.
/// - Đường dẫn mặc định: /api/Warehouse
/// - Nhóm Swagger: Warehouses
/// </summary>
[Authorize]
[Route("api/[controller]")]
[Tags("Warehouses")]
public class WarehouseController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Kho hàng.
    /// POST: /api/Warehouse
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo kho hàng thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin Kho hàng.
    /// PUT: /api/Warehouse/{id}
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
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
    /// API Xóa kho hàng (Xóa mềm).
    /// DELETE: /api/Warehouse/{id}
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
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
