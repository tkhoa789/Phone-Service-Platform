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
/// HANDLER xử lý các yêu cầu truy vấn thông tin Phiếu điều chuyển kho (GetById, GetList/Search).
/// </summary>
public class WarehouseTransferQueryHandlers :
    IRequestHandler<GetWarehouseTransferByIdQuery, WarehouseTransferDto>,
    IRequestHandler<GetWarehouseTransfersQuery, IEnumerable<WarehouseTransferDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public WarehouseTransferQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy chi tiết thông tin Phiếu điều chuyển kho theo ID kèm danh sách Items chi tiết.
    /// </summary>
    public async Task<WarehouseTransferDto> Handle(GetWarehouseTransferByIdQuery request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var itemRepo = _unitOfWork.Repository<WarehouseTransferItemEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải phiếu điều chuyển chính
        var transfer = await transferRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển kho", request.Id);
        }

        // 2. Tải Kho xuất & Kho nhận
        var fromWh = await warehouseRepo.GetByIdAsNoTrackingAsync(transfer.FromWarehouseId, cancellationToken);
        var toWh = await warehouseRepo.GetByIdAsNoTrackingAsync(transfer.ToWarehouseId, cancellationToken);

        // 3. Tải tất cả chi tiết mặt hàng của phiếu chuyển
        var items = await itemRepo.FindAsNoTrackingAsync(i => i.TransferId == transfer.Id, cancellationToken);

        // 4. Ánh xạ phiếu chính sang DTO
        var dto = transfer.Adapt<WarehouseTransferDto>();
        dto.FromWarehouseName = fromWh?.Name ?? "Không xác định";
        dto.ToWarehouseName = toWh?.Name ?? "Không xác định";
        dto.Status = transfer.Status.ToString();
        dto.Items = new List<WarehouseTransferItemDto>();

        // 5. Nạp thông tin biến thể cho từng Item
        foreach (var item in items)
        {
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(item.ProductVariantId, cancellationToken);
            var itemDto = item.Adapt<WarehouseTransferItemDto>();
            itemDto.VariantName = variant?.Name ?? "Mặt hàng không tồn tại";
            itemDto.Sku = variant?.Sku ?? string.Empty;
            dto.Items.Add(itemDto);
        }

        return dto;
    }

    /// <summary>
    /// Lấy danh sách các Phiếu điều chuyển kho kèm theo bộ lọc tìm kiếm.
    /// </summary>
    public async Task<IEnumerable<WarehouseTransferDto>> Handle(GetWarehouseTransfersQuery request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var itemRepo = _unitOfWork.Repository<WarehouseTransferItemEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải toàn bộ Phiếu điều chuyển không theo dõi lên RAM
        var transfers = await transferRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // 2. Áp dụng các điều kiện lọc (nếu có) trên RAM
        if (request.FromWarehouseId.HasValue)
        {
            transfers = transfers.Where(x => x.FromWarehouseId == request.FromWarehouseId.Value);
        }

        if (request.ToWarehouseId.HasValue)
        {
            transfers = transfers.Where(x => x.ToWarehouseId == request.ToWarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            transfers = transfers.Where(x => x.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        // 3. Tải trước các thực thể liên quan lên RAM để tránh N+1
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var items = await itemRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);
        var itemsGroup = items.GroupBy(i => i.TransferId).ToDictionary(g => g.Key, g => g.ToList());

        // 4. Ánh xạ danh sách phiếu điều chuyển sang DTO
        var dtos = transfers.Select(t =>
        {
            var dto = t.Adapt<WarehouseTransferDto>();
            dto.Status = t.Status.ToString();

            // Gán tên Kho xuất
            if (warehouseMap.TryGetValue(t.FromWarehouseId, out var fromWhName))
            {
                dto.FromWarehouseName = fromWhName;
            }
            else
            {
                dto.FromWarehouseName = "Không xác định";
            }

            // Gán tên Kho nhận
            if (warehouseMap.TryGetValue(t.ToWarehouseId, out var toWhName))
            {
                dto.ToWarehouseName = toWhName;
            }
            else
            {
                dto.ToWarehouseName = "Không xác định";
            }

            // Gán danh sách Items
            if (itemsGroup.TryGetValue(t.Id, out var transferItems))
            {
                dto.Items = transferItems.Select(item =>
                {
                    var itemDto = item.Adapt<WarehouseTransferItemDto>();
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
