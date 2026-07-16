using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Customer.Commands;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Customer.Queries;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER quản lý các API liên quan đến Hồ sơ khách hàng (Customer).
/// </summary>
[Route("api/[controller]")]
[Tags("Customers")]
public class CustomerController : BaseApiController
{
    /// <summary>
    /// API Tạo mới thông tin Khách hàng.
    /// POST: /api/Customer
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo hồ sơ khách hàng thành công."));
    }

    /// <summary>
    /// API Cập nhật thông tin Khách hàng theo ID.
    /// PUT: /api/Customer/{id}
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trên URL và Body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật hồ sơ khách hàng thành công."));
    }

    /// <summary>
    /// API Xóa mềm hồ sơ Khách hàng (Chỉ cho phép nếu chưa phát sinh giao dịch).
    /// DELETE: /api/Customer/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteCustomerCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa hồ sơ khách hàng thành công."));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Khách hàng theo ID khóa chính.
    /// GET: /api/Customer/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetCustomerByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<CustomerDto>.Success(result));
    }

    /// <summary>
    /// API Tra cứu hồ sơ Khách hàng nhanh bằng số điện thoại.
    /// GET: /api/Customer/phone/{phone}
    /// </summary>
    [HttpGet("phone/{phone}")]
    public async Task<IActionResult> GetByPhone(string phone, CancellationToken cancellationToken)
    {
        var query = new GetCustomerByPhoneQuery(phone);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<CustomerDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách Khách hàng kèm bộ lọc từ khóa tìm kiếm (tên hoặc số điện thoại).
    /// GET: /api/Customer
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? keyword, CancellationToken cancellationToken)
    {
        var query = new GetCustomersQuery(keyword);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<CustomerDto>>.Success(result));
    }
}
