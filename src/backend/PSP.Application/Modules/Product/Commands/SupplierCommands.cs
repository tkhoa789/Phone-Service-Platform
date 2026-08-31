using MediatR;

namespace PSP.Application.Modules.Product.Commands;

public record CreateSupplierCommand(
    string Code,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxCode = null,
    decimal DebtAmount = 0,
    decimal CreditLimit = 500000000,
    int PaymentTermsDays = 30
) : IRequest<Guid>;

public record UpdateSupplierCommand(
    Guid Id,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxCode = null,
    decimal CreditLimit = 500000000,
    int PaymentTermsDays = 30,
    byte[]? RowVersion = null
) : IRequest<bool>;

public record DeleteSupplierCommand(
    Guid Id,
    byte[]? RowVersion = null
) : IRequest<bool>;

public record PaySupplierDebtCommand(
    Guid SupplierId,
    decimal Amount,
    string PaymentMethod,
    string ReferenceNo,
    string? Note,
    byte[]? RowVersion = null
) : IRequest<bool>;
