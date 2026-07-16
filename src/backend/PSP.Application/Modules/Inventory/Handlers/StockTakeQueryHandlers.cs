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

    public StockTakeQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        // 2. Áp dụng các điều kiện lọc (nếu có) trên RAM
        if (request.WarehouseId.HasValue)
        {
            stockTakes = stockTakes.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            stockTakes = stockTakes.Where(x => x.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        // 3. Tải trước các thực thể liên quan lên RAM để tránh N+1
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var items = await itemRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);
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
}
