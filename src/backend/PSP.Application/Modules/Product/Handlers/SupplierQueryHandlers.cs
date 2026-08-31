using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

public class SupplierQueryHandlers :
    IRequestHandler<GetSupplierByIdQuery, SupplierDto>,
    IRequestHandler<GetAllSuppliersQuery, IEnumerable<SupplierDto>>,
    IRequestHandler<GetSupplierDebtLedgerQuery, IEnumerable<SupplierDebtTransactionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public SupplierQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SupplierDto> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var supplier = await supplierRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        return supplier.Adapt<SupplierDto>();
    }

    public async Task<IEnumerable<SupplierDto>> Handle(GetAllSuppliersQuery request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var suppliers = await supplierRepo.GetAllAsNoTrackingAsync(cancellationToken);
        return suppliers.Adapt<IEnumerable<SupplierDto>>();
    }

    public async Task<IEnumerable<SupplierDebtTransactionDto>> Handle(GetSupplierDebtLedgerQuery request, CancellationToken cancellationToken)
    {
        var transactionRepo = _unitOfWork.Repository<SupplierDebtTransactionEntity>();
        var transactions = await transactionRepo.FindAsync(x => x.SupplierId == request.SupplierId, cancellationToken);
        var ordered = transactions.OrderByDescending(x => x.CreatedAt);
        return ordered.Adapt<IEnumerable<SupplierDebtTransactionDto>>();
    }
}
