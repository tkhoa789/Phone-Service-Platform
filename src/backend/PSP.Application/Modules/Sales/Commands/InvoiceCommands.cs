using System;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.Commands;

/// <summary>
/// Lệnh xuất hóa đơn từ một đơn hàng bán lẻ (SalesOrder).
/// </summary>
public record CreateInvoiceCommand(Guid SalesOrderId) : IRequest<Guid>;

/// <summary>
/// Lệnh ghi nhận một giao dịch thanh toán thực tế cho hóa đơn.
/// Hỗ trợ thanh toán nhiều lần bằng nhiều phương thức khác nhau.
/// </summary>
public record CreatePaymentCommand(
    Guid InvoiceId,
    Guid PaymentMethodId,
    string Code, // Mã giao dịch đối soát (ví dụ mã giao dịch ngân hàng, mã bill chuyển khoản)
    decimal Amount
) : IRequest<Guid>;

/// <summary>
/// Lệnh hủy hóa đơn.
/// </summary>
public record CancelInvoiceCommand(Guid Id) : IRequest<bool>;
