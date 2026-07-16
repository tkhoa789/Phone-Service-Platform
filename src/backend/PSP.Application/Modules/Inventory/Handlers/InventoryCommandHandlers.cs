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

    public InventoryCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        inventory.MinimumStock = request.MinimumStock;
        inventoryRepo.Update(inventory);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return true;
    }

    /// <summary>
    /// Xử lý cập nhật trạng thái của mã IMEI (InStock, Sold, Repairing, WarrantyHold, Disposed).
    /// </summary>
    public async Task<bool> Handle(UpdateImeiStatusCommand request, CancellationToken cancellationToken)
    {
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // Tìm mã IMEI trong hệ thống (Tra cứu theo Unique Index Imei)
        var existing = await imeiRepo.FindAsync(i => i.Imei == request.Imei, cancellationToken);
        var imei = existing.FirstOrDefault();
        
        if (imei == null)
        {
            throw new NotFoundException("Mã IMEI", request.Imei);
        }

        // Chuyển đổi chuỗi String sang Enum
        if (Enum.TryParse<ImeiStatus>(request.Status, true, out var targetStatus))
        {
            imei.Status = targetStatus;
            imeiRepo.Update(imei);
            
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }
}
