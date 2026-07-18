using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Sales.DTOs;

namespace PSP.Application.Modules.Sales.Queries;

/// <summary>
/// Truy vấn tìm hóa đơn theo ID.
/// </summary>
public record GetInvoiceByIdQuery(Guid Id) : IRequest<InvoiceDto>;

/// <summary>
/// Truy vấn tìm hóa đơn được xuất từ đơn hàng cụ thể.
/// </summary>
public record GetInvoiceBySalesOrderIdQuery(Guid SalesOrderId) : IRequest<InvoiceDto>;

/// <summary>
/// Truy vấn lấy tất cả hóa đơn trong hệ thống.
/// </summary>
public record GetAllInvoicesQuery : IRequest<IEnumerable<InvoiceDto>>;

/// <summary>
/// Truy vấn lấy danh sách tất cả các phương thức thanh toán khả dụng.
/// </summary>
public record GetAllPaymentMethodsQuery : IRequest<IEnumerable<PaymentMethodDto>>;
