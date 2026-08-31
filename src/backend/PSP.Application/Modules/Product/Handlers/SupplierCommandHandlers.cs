using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using System.Linq;

namespace PSP.Application.Modules.Product.Handlers;

public class SupplierCommandHandlers :
    IRequestHandler<CreateSupplierCommand, Guid>,
    IRequestHandler<UpdateSupplierCommand, bool>,
    IRequestHandler<DeleteSupplierCommand, bool>,
    IRequestHandler<PaySupplierDebtCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdempotencyService _idempotencyService;

    public SupplierCommandHandlers(IUnitOfWork unitOfWork, IIdempotencyService idempotencyService)
    {
        _unitOfWork = unitOfWork;
        _idempotencyService = idempotencyService;
    }

    public async Task<Guid> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        var existing = await supplierRepo.FindFirstIgnoreQueryFiltersAsync(x => x.Code == request.Code, cancellationToken);
        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                request.Adapt(existing);
                supplierRepo.Update(existing);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return existing.Id;
            }
            throw new ConflictException($"Nhà cung cấp với mã {request.Code} đã tồn tại.");
        }

        var supplier = request.Adapt<SupplierEntity>();

        await supplierRepo.AddAsync(supplier, cancellationToken);
        
        _idempotencyService.AttachRecord(supplier.Id);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return supplier.Id;
    }

    public async Task<bool> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        var supplier = await supplierRepo.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        if (request.RowVersion != null && !supplier.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin nhà cung cấp đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        request.Adapt(supplier);
        supplierRepo.Update(supplier);
        
        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu nhà cung cấp đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    public async Task<bool> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        var supplier = await supplierRepo.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        if (request.RowVersion != null && !supplier.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin nhà cung cấp đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        var purchaseOrderRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var hasOrders = (await purchaseOrderRepo.FindAsync(x => x.SupplierId == request.Id, cancellationToken)).Any();
        if (hasOrders)
        {
            throw new BadRequestException("Không thể xóa nhà cung cấp này vì đã có phiếu nhập hàng liên kết.");
        }

        supplierRepo.Remove(supplier);
        
        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu nhà cung cấp đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    public async Task<bool> Handle(PaySupplierDebtCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var transactionRepo = _unitOfWork.Repository<SupplierDebtTransactionEntity>();

        var supplier = await supplierRepo.GetByIdAsync(request.SupplierId, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.SupplierId);
        }

        if (request.RowVersion != null && !supplier.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin nhà cung cấp đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.");
        }

        if (request.Amount <= 0)
        {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0.");
        }

        // Reduce debt
        supplier.DebtAmount -= request.Amount;
        if (supplier.DebtAmount < 0) supplier.DebtAmount = 0;

        supplierRepo.Update(supplier);

        // Record transaction log
        var debtTx = new SupplierDebtTransactionEntity
        {
            SupplierId = request.SupplierId,
            TransactionType = "PAYMENT",
            Amount = request.Amount,
            BalanceAfter = supplier.DebtAmount,
            ReferenceNo = string.IsNullOrWhiteSpace(request.ReferenceNo) ? $"PAY-{DateTime.UtcNow:yyMMddHHmmss}" : request.ReferenceNo,
            PaymentMethod = request.PaymentMethod,
            Note = request.Note
        };

        await transactionRepo.AddAsync(debtTx, cancellationToken);
        
        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Thông tin công nợ nhà cung cấp đã bị thay đổi bởi giao dịch khác. Vui lòng thử lại.");
        }

        return true;
    }
}
