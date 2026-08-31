using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.API.Attributes;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các Đơn hàng bán lẻ (SalesOrders).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này tiếp nhận các yêu cầu lập đơn hàng từ máy POS/Frontend.
/// - Cung cấp cổng thay đổi trạng thái đơn hàng (Duyệt thanh toán / Hủy đơn) và tra cứu lịch sử mua hàng.
/// </summary>
[Authorize]
[Route("api/[controller]")]
[Tags("SalesOrders")]
public class SalesOrderController : BaseApiController
{
    /// <summary>
    /// API Tạo mới đơn hàng bán lẻ (POS).
    /// POST: /api/SalesOrder
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales")]
    [HttpPost]
    [Idempotent]
    public async Task<IActionResult> Create([FromBody] CreateSalesOrderCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo đơn hàng thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái đơn hàng (Pending -> Confirmed -> Completed / Cancelled).
    /// PUT: /api/SalesOrder/{id}/status
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager,Sales")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSalesOrderStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái đơn hàng thành công"));
    }

    /// <summary>
    /// API Xóa mềm đơn hàng (Chỉ cho phép xóa khi đơn hàng chưa Hoàn thành).
    /// DELETE: /api/SalesOrder/{id}
    /// </summary>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteSalesOrderCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa đơn hàng thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin đơn hàng và danh sách sản phẩm mua kèm theo.
    /// GET: /api/SalesOrder/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSalesOrderByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<SalesOrderDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách lịch sử mua hàng của một khách hàng cụ thể.
    /// GET: /api/SalesOrder/customer/{customerId}
    /// </summary>
    [HttpGet("customer/{customerId:guid}")]
    public async Task<IActionResult> GetByCustomerId(Guid customerId, CancellationToken cancellationToken)
    {
        var query = new GetSalesOrdersByCustomerIdQuery(customerId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<SalesOrderDto>>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách toàn bộ đơn hàng trong hệ thống.
    /// GET: /api/SalesOrder
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllSalesOrdersQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<SalesOrderDto>>.Success(result));
    }
}
