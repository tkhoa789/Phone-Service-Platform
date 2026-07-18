using System;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Giao dịch thanh toán thực tế (Payment).
/// </summary>
public record PaymentDto
{
    public Guid Id { get; init; }
    public Guid InvoiceId { get; init; }
    public Guid PaymentMethodId { get; init; }
    public string PaymentMethodName { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public PaymentStatus Status { get; init; }
    public DateTime PaymentDate { get; init; }
}
