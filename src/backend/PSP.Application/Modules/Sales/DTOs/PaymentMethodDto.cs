using System;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Phương thức thanh toán (PaymentMethod).
/// </summary>
public record PaymentMethodDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}
