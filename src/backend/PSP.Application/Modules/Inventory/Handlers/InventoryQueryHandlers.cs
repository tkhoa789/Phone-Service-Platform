using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.DTOs;
using PSP.Application.Modules.Inventory.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Inventory.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu truy vấn thông tin tồn kho và IMEI (Danh sách tồn kho, Tra cứu IMEI).
/// </summary>
public class InventoryQueryHandlers :
    IRequestHandler<GetWarehouseInventoriesQuery, IEnumerable<InventoryDto>>,
    IRequestHandler<GetWarehouseLowStockQuery, IEnumerable<InventoryDto>>,
    IRequestHandler<GetImeiByNumberQuery, ImeiDto>,
    IRequestHandler<GetImeisQuery, IEnumerable<ImeiDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public InventoryQueryHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Lấy danh sách số lượng tồn kho kèm bộ lọc tùy chọn (lọc theo Kho, Biến thể sản phẩm, hoặc Lọc sản phẩm sắp hết hàng).
    /// </summary>
    public async Task<IEnumerable<InventoryDto>> Handle(GetWarehouseInventoriesQuery request, CancellationToken cancellationToken)
    {
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải danh sách tồn kho từ DB không theo dõi (AsNoTracking)
        var inventories = await inventoryRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // BOLA / Branch Isolation Check
        if (!_currentUserService.IsGlobalAdmin && Guid.TryParse(_currentUserService.BranchId, out Guid userBranchId))
        {
            var branchWarehouses = await warehouseRepo.FindAsNoTrackingAsync(w => w.BranchId == userBranchId, cancellationToken);
            var branchWarehouseIds = branchWarehouses.Select(w => w.Id).ToList();
            inventories = inventories.Where(x => branchWarehouseIds.Contains(x.WarehouseId));
        }

        // 2. Áp dụng các bộ lọc tìm kiếm trên bộ nhớ RAM
        if (request.WarehouseId.HasValue)
        {
            inventories = inventories.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (request.ProductVariantId.HasValue)
        {
            inventories = inventories.Where(x => x.ProductVariantId == request.ProductVariantId.Value);
        }

        if (request.IsLowStock.HasValue)
        {
            inventories = inventories.Where(x => (x.Quantity <= x.MinimumStock) == request.IsLowStock.Value);
        }

        // 3. Tải trước toàn bộ kho hàng và biến thể sản phẩm lên RAM để tránh N+1
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);

        // 4. Ánh xạ dữ liệu sang DTOs
        var dtos = inventories.Select(inv =>
        {
            var dto = inv.Adapt<InventoryDto>();
            
            if (warehouseMap.TryGetValue(inv.WarehouseId, out var whName))
            {
                dto.WarehouseName = whName;
            }

            if (variantMap.TryGetValue(inv.ProductVariantId, out var variant))
            {
                dto.VariantName = variant.Name;
                dto.Sku = variant.Sku;
            }

            return dto;
        }).ToList();

        return dtos;
    }

    /// <summary>
    /// Lấy danh sách các sản phẩm có số lượng tồn kho dưới ngưỡng tối thiểu của một kho cụ thể.
    /// </summary>
    public async Task<IEnumerable<InventoryDto>> Handle(GetWarehouseLowStockQuery request, CancellationToken cancellationToken)
    {
        var query = new GetWarehouseInventoriesQuery(
            WarehouseId: request.WarehouseId,
            IsLowStock: true
        );
        return await Handle(query, cancellationToken);
    }

    /// <summary>
    /// Tra cứu chi tiết thông tin và lịch sử của một mã số IMEI.
    /// </summary>
    public async Task<ImeiDto> Handle(GetImeiByNumberQuery request, CancellationToken cancellationToken)
    {
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        // 1. Tra cứu IMEI theo mã số IMEI
        var existing = await imeiRepo.FindAsNoTrackingAsync(i => i.Imei == request.Imei, cancellationToken);
        var imei = existing.FirstOrDefault();
        if (imei == null)
        {
            throw new NotFoundException("Mã số IMEI", request.Imei);
        }

        // 2. Tìm thông tin chi tiết biến thể sản phẩm và kho hàng liên kết
        var variant = await variantRepo.GetByIdAsNoTrackingAsync(imei.ProductVariantId, cancellationToken);
        
        WarehouseEntity? warehouse = null;
        if (imei.WarehouseId.HasValue)
        {
            warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(imei.WarehouseId.Value, cancellationToken);
            
            // BOLA / Branch Isolation Check
            if (!_currentUserService.IsGlobalAdmin && Guid.TryParse(_currentUserService.BranchId, out Guid userBranchId))
            {
                if (warehouse != null && warehouse.BranchId != userBranchId)
                {
                    throw new ForbiddenException("Bạn không có quyền truy cập IMEI của chi nhánh khác.");
                }
            }
        }

        // 3. Ánh xạ sang DTO
        var dto = imei.Adapt<ImeiDto>();
        dto.Status = imei.Status.ToString();
        dto.VariantName = variant?.Name ?? "Biến thể không tồn tại";
        dto.Sku = variant?.Sku ?? string.Empty;
        dto.WarehouseName = warehouse?.Name ?? "Không nằm trong kho (Đã bán/Xuất đi)";

        return dto;
    }

    /// <summary>
    /// Lấy danh sách tất cả các IMEI kèm bộ lọc tùy chọn.
    /// </summary>
    public async Task<IEnumerable<ImeiDto>> Handle(GetImeisQuery request, CancellationToken cancellationToken)
    {
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải danh sách IMEI không theo dõi (AsNoTracking)
        var imeis = await imeiRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // BOLA / Branch Isolation Check
        if (!_currentUserService.IsGlobalAdmin && Guid.TryParse(_currentUserService.BranchId, out Guid userBranchId))
        {
            var branchWarehouses = await warehouseRepo.FindAsNoTrackingAsync(w => w.BranchId == userBranchId, cancellationToken);
            var branchWarehouseIds = branchWarehouses.Select(w => w.Id).ToList();
            imeis = imeis.Where(x => x.WarehouseId.HasValue && branchWarehouseIds.Contains(x.WarehouseId.Value));
        }

        // 2. Áp dụng bộ lọc trên RAM
        if (request.WarehouseId.HasValue)
        {
            imeis = imeis.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (request.ProductVariantId.HasValue)
        {
            imeis = imeis.Where(x => x.ProductVariantId == request.ProductVariantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            imeis = imeis.Where(x => x.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        // 3. Tải trước kho và biến thể để tránh N+1
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);

        // 4. Ánh xạ danh sách sang DTO
        var dtos = imeis.Select(imei =>
        {
            var dto = imei.Adapt<ImeiDto>();
            dto.Status = imei.Status.ToString();

            if (variantMap.TryGetValue(imei.ProductVariantId, out var variant))
            {
                dto.VariantName = variant.Name;
                dto.Sku = variant.Sku;
            }

            if (imei.WarehouseId.HasValue && warehouseMap.TryGetValue(imei.WarehouseId.Value, out var whName))
            {
                dto.WarehouseName = whName;
            }
            else
            {
                dto.WarehouseName = "Không nằm trong kho (Đã bán/Xuất đi)";
            }

            return dto;
        }).ToList();

        return dtos;
    }
}
