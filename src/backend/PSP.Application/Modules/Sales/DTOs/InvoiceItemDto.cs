using System;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Chi tiết hóa đơn (InvoiceItem).
/// </summary>
public record InvoiceItemDto
{
    public Guid Id { get; init; }
    public Guid ProductVariantId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal Total => UnitPrice * Quantity;
}
