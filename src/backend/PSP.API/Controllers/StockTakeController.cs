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
/// CONTROLLER tiếp nhận các yêu cầu HTTP quản lý việc Kiểm kê kho (StockTake).
/// </summary>
[Authorize(Policy = Permissions.StockTake.View)]
[Route("api/[controller]")]
[Tags("StockTakes")]
public class StockTakeController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu kiểm kê kho (Trạng thái mặc định là Draft).
    /// POST: /api/StockTake
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStockTakeCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo phiếu kiểm kê kho thành công."));
    }

    /// <summary>
    /// API Cập nhật thông tin Phiếu kiểm kê (Chỉ áp dụng khi phiếu ở trạng thái Draft hoặc InProgress).
    /// PUT: /api/StockTake/{id}
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStockTakeCommand command, CancellationToken cancellationToken)
    {
        if (command.Id != Guid.Empty && id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        if (command.Id == Guid.Empty)
        {
            command = command with { Id = id };
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật phiếu kiểm kê kho thành công."));
    }

    /// <summary>
    /// API Bắt đầu kiểm kê kho (Chuyển trạng thái sang InProgress).
    /// PUT: /api/StockTake/{id}/start
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Start)]
    [HttpPut("{id:guid}/start")]
    public async Task<IActionResult> Start(Guid id, CancellationToken cancellationToken)
    {
        var command = new StartStockTakeCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Chuyển sang trạng thái Đang kiểm kê thành công."));
    }

    /// <summary>
    /// API Hoàn tất kiểm kê kho (InProgress -> Completed). Điều chỉnh số lượng tồn và IMEI theo thực tế kiểm đếm.
    /// Quyền hạn: StockTake.COMPLETE (Owner, Admin, Manager - Bị từ chối đối với Inventory).
    /// PUT: /api/StockTake/{id}/complete
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Complete)]
    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] CompleteStockTakeCommand? command, CancellationToken cancellationToken)
    {
        command ??= new CompleteStockTakeCommand { Id = id };

        if (command.Id != Guid.Empty && id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        if (command.Id == Guid.Empty)
        {
            command = command with { Id = id };
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn tất kiểm kê và cân bằng tồn kho thành công."));
    }

    /// <summary>
    /// API Hủy phiếu kiểm kê kho (StockTake.CANCEL - Owner, Admin, Manager).
    /// PUT: /api/StockTake/{id}/cancel
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Cancel)]
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var command = new CancelStockTakeCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy phiếu kiểm kê kho thành công."));
    }

    /// <summary>
    /// API Xóa mềm Phiếu kiểm kê kho (Chỉ áp dụng khi phiếu ở trạng thái Draft).
    /// DELETE: /api/StockTake/{id}
    /// </summary>
    [Authorize(Policy = Permissions.StockTake.Cancel)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteStockTakeCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa phiếu kiểm kê kho thành công."));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Phiếu kiểm kê kho theo ID kèm danh sách chi tiết mặt hàng kiểm đếm.
    /// GET: /api/StockTake/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetStockTakeByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<StockTakeDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách phiếu kiểm kê kho kèm các bộ lọc tìm kiếm.
    /// GET: /api/StockTake
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? warehouseId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = new GetStockTakesQuery(warehouseId, status);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<StockTakeDto>>.Success(result));
    }
}
