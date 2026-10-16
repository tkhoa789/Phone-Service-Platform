using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý Hóa đơn & Giao dịch thanh toán (Invoices & Payments).
/// </summary>
[Authorize(Policy = Permissions.Invoice.View)]
[Route("api/[controller]")]
[Tags("Invoices")]
public class InvoiceController : BaseApiController
{
    /// <summary>
    /// API Xuất hóa đơn tài chính mới từ một Đơn bán hàng (SalesOrder).
    /// POST: /api/Invoice
    /// </summary>
    [Authorize(Policy = Permissions.Invoice.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Xuất hóa đơn thành công."));
    }

    /// <summary>
    /// API Ghi nhận giao dịch thanh toán mới cho hóa đơn (Chấp nhận thanh toán nhiều lần).
    /// POST: /api/Invoice/payment
    /// </summary>
    [Authorize(Policy = Permissions.Invoice.Create)]
    [HttpPost("payment")]
    public async Task<IActionResult> Pay([FromBody] CreatePaymentCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Ghi nhận thanh toán thành công."));
    }

    /// <summary>
    /// API Hủy hóa đơn tài chính (Invoice.CANCEL - Owner, Admin, Manager).
    /// PUT: /api/Invoice/{id}/cancel
    /// </summary>
    [Authorize(Policy = Permissions.Invoice.Cancel)]
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var command = new CancelInvoiceCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy hóa đơn thành công."));
    }

    /// <summary>
    /// API Lấy chi tiết hóa đơn (kèm danh sách mặt hàng và lịch sử thanh toán).
    /// GET: /api/Invoice/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetInvoiceByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<InvoiceDto>.Success(result));
    }

    /// <summary>
    /// API Tìm hóa đơn được xuất từ mã Đơn bán hàng cụ thể.
    /// GET: /api/Invoice/sales-order/{salesOrderId}
    /// </summary>
    [HttpGet("sales-order/{salesOrderId:guid}")]
    public async Task<IActionResult> GetBySalesOrderId(Guid salesOrderId, CancellationToken cancellationToken)
    {
        var query = new GetInvoiceBySalesOrderIdQuery(salesOrderId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<InvoiceDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả các hóa đơn trong hệ thống.
    /// GET: /api/Invoice
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllInvoicesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<InvoiceDto>>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách các phương thức thanh toán khả dụng (ví dụ: tiền mặt, chuyển khoản).
    /// GET: /api/Invoice/payment-methods
    /// </summary>
    [HttpGet("payment-methods")]
    public async Task<IActionResult> GetPaymentMethods(CancellationToken cancellationToken)
    {
        var query = new GetAllPaymentMethodsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<PaymentMethodDto>>.Success(result));
    }
}
