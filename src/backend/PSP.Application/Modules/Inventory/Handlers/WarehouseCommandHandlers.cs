using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Inventory.Handlers;

/// <summary>
/// HANDLER xử lý các lệnh Command liên quan đến Kho hàng (Create, Update, Delete).
/// Tuân thủ quy tắc Clean Architecture và MediatR Handler.
/// </summary>
public class WarehouseCommandHandlers :
    IRequestHandler<CreateWarehouseCommand, Guid>,
    IRequestHandler<UpdateWarehouseCommand, bool>,
    IRequestHandler<DeleteWarehouseCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;

    /// <summary>
    /// Inject Unit of Work để quản lý các Repository và Transactions.
    /// </summary>
    public WarehouseCommandHandlers(IUnitOfWork unitOfWork, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Xử lý tạo mới một kho hàng.
    /// </summary>
    public async Task<Guid> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra chi nhánh (Branch) sở hữu kho hàng có tồn tại và đang hoạt động không
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branch = await branchRepo.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            throw new NotFoundException("Chi nhánh", request.BranchId);
        }

        _scopeContext.ValidateBranchAccess(request.BranchId, "chi nhánh");

        // 2. Kiểm tra trùng lặp mã kho hàng (Code)
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var existing = await warehouseRepo.FindAsync(w => w.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Kho hàng với mã {request.Code} đã tồn tại trong hệ thống.");
        }

        // 3. Ánh xạ DTO Command sang thực thể WarehouseEntity và lưu dữ liệu
        var warehouse = request.Adapt<WarehouseEntity>();
        
        await warehouseRepo.AddAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Trả về khóa chính của kho vừa được tạo
        return warehouse.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin kho hàng.
    /// </summary>
    public async Task<bool> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        
        // 1. Tìm kho hàng cần cập nhật theo ID
        var warehouse = await warehouseRepo.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.Id);
        }

        _scopeContext.ValidateBranchAccess(warehouse.BranchId, "kho hàng");

        // 2. Cập nhật thông tin mới từ Command vào thực thể cũ
        request.Adapt(warehouse);
        warehouseRepo.Update(warehouse);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm một kho hàng và thực thi đầy đủ các kiểm tra ràng buộc nghiệp vụ.
    /// </summary>
    public async Task<bool> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        // 1. Tìm kiếm kho hàng cần xóa
        var warehouse = await warehouseRepo.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.Id);
        }

        _scopeContext.ValidateBranchAccess(warehouse.BranchId, "kho hàng");

        // 2. KIỂM TRA RÀNG BUỘC 1: Còn hàng tồn kho khả dụng (Quantity > 0) trong kho không?
        var hasStock = await warehouseRepo.FindAsync(
            w => w.Id == request.Id && w.Inventories.Any(inv => inv.Quantity > 0),
            cancellationToken
        );
        if (hasStock.Any())
        {
            throw new ConflictException("Không thể xóa kho hàng này vì vẫn còn hàng tồn kho khả dụng.");
        }

        // 3. KIỂM TRA RÀNG BUỘC 2: Còn thiết bị quản lý theo mã IMEI đang nằm trong kho không?
        var hasImeis = await warehouseRepo.FindAsync(
            w => w.Id == request.Id && w.Imeis.Any(),
            cancellationToken
        );
        if (hasImeis.Any())
        {
            throw new ConflictException("Không thể xóa kho hàng này vì vẫn còn các thiết bị quản lý theo IMEI đang được lưu trữ.");
        }

        // 4. KIỂM TRA RÀNG BUỘC 3: Kho hàng đã phát sinh chứng từ nhập kho (PurchaseOrder) nào chưa?
        var hasPurchaseOrders = await _unitOfWork.Repository<PurchaseOrderEntity>()
            .FindAsync(po => po.WarehouseId == request.Id, cancellationToken);
        if (hasPurchaseOrders.Any())
        {
            throw new ConflictException("Không thể xóa kho hàng này vì đã phát sinh chứng từ phiếu nhập kho liên kết.");
        }

        // 5. KIỂM TRA RÀNG BUỘC 4: Kho hàng đã phát sinh chứng từ phiếu điều chuyển kho (WarehouseTransfer) nào chưa?
        var hasTransfers = await _unitOfWork.Repository<WarehouseTransferEntity>()
            .FindAsync(wt => wt.FromWarehouseId == request.Id || wt.ToWarehouseId == request.Id, cancellationToken);
        if (hasTransfers.Any())
        {
            throw new ConflictException("Không thể xóa kho hàng này vì đã phát sinh chứng từ phiếu điều chuyển kho liên kết.");
        }

        // 6. KIỂM TRA RÀNG BUỘC 5: Kho hàng đã phát sinh chứng từ phiếu kiểm kê (StockTake) nào chưa?
        var hasStockTakes = await _unitOfWork.Repository<StockTakeEntity>()
            .FindAsync(st => st.WarehouseId == request.Id, cancellationToken);
        if (hasStockTakes.Any())
        {
            throw new ConflictException("Không thể xóa kho hàng này vì đã phát sinh chứng từ kiểm kê kho liên kết.");
        }

        // 7. Nếu vượt qua tất cả kiểm tra ràng buộc, thực hiện xóa mềm (Soft Delete)
        warehouseRepo.Remove(warehouse);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
