using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Inventory.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Inventory.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu thay đổi dữ liệu tồn kho và IMEI (Cập nhật định mức tồn tối thiểu, Cập nhật trạng thái IMEI).
/// </summary>
public class InventoryCommandHandlers :
    IRequestHandler<UpdateInventoryMinStockCommand, bool>,
    IRequestHandler<UpdateImeiStatusCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public InventoryCommandHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Xử lý cập nhật định mức cảnh báo tồn kho tối thiểu.
    /// </summary>
    public async Task<bool> Handle(UpdateInventoryMinStockCommand request, CancellationToken cancellationToken)
    {
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        
        var inventory = await inventoryRepo.GetByIdAsync(request.Id, cancellationToken);
        if (inventory == null)
        {
            throw new NotFoundException("Tồn kho", request.Id);
        }

        // Fail-Closed Branch Isolation Check
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(inventory.WarehouseId, cancellationToken);
        if (warehouse != null)
        {
            _scopeContext.ValidateBranchAccess(warehouse.BranchId, "tồn kho");
        }

        inventory.MinimumStock = request.MinimumStock;
        inventoryRepo.Update(inventory);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return true;
    }

    /// <summary>
    /// Xử lý cập nhật trạng thái của mã IMEI (InStock, Sold, Repairing, WarrantyHold, Disposed, WrittenOff).
    /// </summary>
    public async Task<bool> Handle(UpdateImeiStatusCommand request, CancellationToken cancellationToken)
    {
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        string cleanImei = request.Imei?.Trim() ?? string.Empty;

        // Tìm mã IMEI trong hệ thống (Tra cứu theo Unique Index Imei)
        var existing = await imeiRepo.FindAsync(i => i.Imei == cleanImei, cancellationToken);
        var imei = existing.FirstOrDefault();
        
        if (imei == null)
        {
            throw new NotFoundException("Mã IMEI", request.Imei);
        }

        // Fail-Closed Branch Isolation Check
        if (imei.WarehouseId.HasValue)
        {
            var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
            var warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(imei.WarehouseId.Value, cancellationToken);
            if (warehouse != null)
            {
                _scopeContext.ValidateBranchAccess(warehouse.BranchId, "IMEI");
            }
        }

        // Chuyển đổi chuỗi String sang Enum
        if (!Enum.TryParse<ImeiStatus>(request.Status, true, out var targetStatus))
        {
            throw new BadRequestException($"Trạng thái IMEI không hợp lệ: {request.Status}");
        }

        // 1. Chặn tuyệt đối các trạng thái kết thúc (Terminal States: Disposed, WrittenOff)
        if (imei.Status == ImeiStatus.Disposed || imei.Status == ImeiStatus.WrittenOff)
        {
            if (targetStatus != imei.Status)
            {
                throw new BadRequestException("Thiết bị ở trạng thái thanh lý hoặc xuất hủy không thể chuyển sang trạng thái khác.");
            }
        }

        // 2. Kiểm tra FSM State Transition Guard theo Ma trận FSM Bảng 3.4
        if (!IsValidImeiTransition(imei.Status, targetStatus))
        {
            throw new BadRequestException($"Không thể chuyển trạng thái IMEI từ '{imei.Status}' sang '{targetStatus}'.");
        }

        if (imei.Status == targetStatus)
        {
            return true;
        }

        imei.Status = targetStatus;
        imeiRepo.Update(imei);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Ma trận kiểm tra tính hợp lệ của việc chuyển đổi trạng thái IMEI (FSM Bảng 3.4).
    /// </summary>
    private static bool IsValidImeiTransition(ImeiStatus current, ImeiStatus target)
    {
        if (current == target)
        {
            return true;
        }

        return current switch
        {
            ImeiStatus.InStock => target is ImeiStatus.Sold or ImeiStatus.Repairing or ImeiStatus.Disposed or ImeiStatus.WrittenOff,
            ImeiStatus.Sold => target is ImeiStatus.Repairing or ImeiStatus.WarrantyHold,
            ImeiStatus.Repairing => target is ImeiStatus.InStock or ImeiStatus.Sold or ImeiStatus.WrittenOff,
            ImeiStatus.WarrantyHold => target is ImeiStatus.Sold or ImeiStatus.Repairing or ImeiStatus.Disposed or ImeiStatus.WrittenOff,
            ImeiStatus.Disposed => false,
            ImeiStatus.WrittenOff => false,
            _ => false
        };
    }
}
