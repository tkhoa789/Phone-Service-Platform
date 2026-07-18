using System;
using System.Collections.Generic;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Hóa đơn tài chính (Invoice).
/// </summary>
public record InvoiceDto
{
    public Guid Id { get; init; }
    public Guid SalesOrderId { get; init; }
    public string SalesOrderCode { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public InvoiceStatus Status { get; init; }
    public decimal Amount { get; init; }
    public DateTime CreatedAt { get; init; }
    public IEnumerable<InvoiceItemDto> Items { get; init; } = new List<InvoiceItemDto>();
    public IEnumerable<PaymentDto> Payments { get; init; } = new List<PaymentDto>();
}
