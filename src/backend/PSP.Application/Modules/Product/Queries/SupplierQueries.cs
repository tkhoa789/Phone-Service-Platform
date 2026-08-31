using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

public record GetSupplierByIdQuery(Guid Id) : IRequest<SupplierDto>;

public record GetAllSuppliersQuery() : IRequest<IEnumerable<SupplierDto>>;

public record GetSupplierDebtLedgerQuery(Guid SupplierId) : IRequest<IEnumerable<SupplierDebtTransactionDto>>;
