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
/// HANDLER xử lý các yêu cầu truy vấn thông tin Phiếu kiểm kê (GetById, GetList/Search).
/// </summary>
public class StockTakeQueryHandlers :
    IRequestHandler<GetStockTakeByIdQuery, StockTakeDto>,
    IRequestHandler<GetStockTakesQuery, IEnumerable<StockTakeDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;

    public StockTakeQueryHandlers(IUnitOfWork unitOfWork, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Lấy chi tiết thông tin Phiếu kiểm kê kho theo ID kèm danh sách Items chi tiết.
    /// </summary>
    public async Task<StockTakeDto> Handle(GetStockTakeByIdQuery request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var itemRepo = _unitOfWork.Repository<StockTakeItemEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải phiếu kiểm kê chính
        var stockTake = await stockTakeRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê kho", request.Id);
        }

        // 2. Tải Kho hàng liên kết
        var warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(stockTake.WarehouseId, cancellationToken);
        _scopeContext.ValidateBranchAccess(warehouse?.BranchId, "phiếu kiểm kê kho");

        // 3. Tải tất cả chi tiết mặt hàng kiểm kê
        var items = await itemRepo.FindAsNoTrackingAsync(i => i.StockTakeId == stockTake.Id, cancellationToken);

        // 4. Ánh xạ phiếu chính sang DTO
        var dto = stockTake.Adapt<StockTakeDto>();
        dto.WarehouseName = warehouse?.Name ?? "Không xác định";
        dto.Status = stockTake.Status.ToString();
        dto.Items = new List<StockTakeItemDto>();

        // 5. Nạp thông tin biến thể cho từng Item
        foreach (var item in items)
        {
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(item.ProductVariantId, cancellationToken);
            var itemDto = item.Adapt<StockTakeItemDto>();
            itemDto.VariantName = variant?.Name ?? "Mặt hàng không tồn tại";
            itemDto.Sku = variant?.Sku ?? string.Empty;
            itemDto.IsImeiControlled = await IsImeiControlledAsync(item.ProductVariantId, cancellationToken);
            dto.Items.Add(itemDto);
        }

        return dto;
    }

    /// <summary>
    /// Lấy danh sách các Phiếu kiểm kê kho kèm theo bộ lọc tìm kiếm.
    /// </summary>
    public async Task<IEnumerable<StockTakeDto>> Handle(GetStockTakesQuery request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var itemRepo = _unitOfWork.Repository<StockTakeItemEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải toàn bộ Phiếu kiểm kê không theo dõi lên RAM
        var stockTakes = await stockTakeRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // RBAC-03: Scope & Branch/Warehouse Isolation
        var accessibleWarehouseIds = await _scopeContext.GetAccessibleWarehouseIdsAsync(_unitOfWork, cancellationToken);
        if (accessibleWarehouseIds != null)
        {
            stockTakes = stockTakes.Where(x => accessibleWarehouseIds.Contains(x.WarehouseId));
        }

        // 2. Áp dụng các điều kiện lọc (nếu có) trên RAM
        if (request.WarehouseId.HasValue)
        {
            if (accessibleWarehouseIds != null && !accessibleWarehouseIds.Contains(request.WarehouseId.Value))
            {
                throw new ForbiddenException("Bạn không có quyền truy cập kho hàng của chi nhánh khác.");
            }
            stockTakes = stockTakes.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            stockTakes = stockTakes.Where(x => x.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();

        // 3. Tải trước các thực thể liên quan lên RAM để tránh N+1
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var items = await itemRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var products = await productRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var categories = await categoryRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);
        var productMap = products.ToDictionary(p => p.Id, p => p);
        var categoryMap = categories.ToDictionary(c => c.Id, c => c);
        var itemsGroup = items.GroupBy(i => i.StockTakeId).ToDictionary(g => g.Key, g => g.ToList());

        // 4. Ánh xạ danh sách phiếu sang DTO
        var dtos = stockTakes.Select(s =>
        {
            var dto = s.Adapt<StockTakeDto>();
            dto.Status = s.Status.ToString();

            // Gán tên Kho
            if (warehouseMap.TryGetValue(s.WarehouseId, out var whName))
            {
                dto.WarehouseName = whName;
            }
            else
            {
                dto.WarehouseName = "Không xác định";
            }

            // Gán danh sách Items
            if (itemsGroup.TryGetValue(s.Id, out var stockTakeItems))
            {
                dto.Items = stockTakeItems.Select(item =>
                {
                    var itemDto = item.Adapt<StockTakeItemDto>();
                    if (variantMap.TryGetValue(item.ProductVariantId, out var variant))
                    {
                        itemDto.VariantName = variant.Name;
                        itemDto.Sku = variant.Sku;

                        if (productMap.TryGetValue(variant.ProductId, out var product) &&
                            categoryMap.TryGetValue(product.CategoryId, out var category))
                        {
                            var isMobile = category.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase);
                            if (!isMobile && category.ParentId.HasValue && categoryMap.TryGetValue(category.ParentId.Value, out var parentCategory))
                            {
                                isMobile = parentCategory.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase);
                            }
                            itemDto.IsImeiControlled = isMobile;
                        }
                    }
                    else
                    {
                        itemDto.VariantName = "Mặt hàng không tồn tại";
                    }
                    return itemDto;
                }).ToList();
            }

            return dto;
        }).ToList();

        return dtos;
    }

    /// <summary>
    /// HÀM TRỢ GIÚP: Xác định xem biến thể sản phẩm có bắt buộc quản lý theo IMEI hay không.
    /// Dựa trên mã danh mục Code = "MOBILE" hoặc danh mục cha của nó có Code = "MOBILE".
    /// </summary>
    private async Task<bool> IsImeiControlledAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsNoTrackingAsync(productVariantId, cancellationToken);
        if (variant == null) return false;

        var product = await _unitOfWork.Repository<ProductEntity>().GetByIdAsNoTrackingAsync(variant.ProductId, cancellationToken);
        if (product == null) return false;

        var category = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(product.CategoryId, cancellationToken);
        if (category == null) return false;

        if (category.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase)) return true;

        if (category.ParentId.HasValue)
        {
            var parentCategory = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(category.ParentId.Value, cancellationToken);
            if (parentCategory != null && parentCategory.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
