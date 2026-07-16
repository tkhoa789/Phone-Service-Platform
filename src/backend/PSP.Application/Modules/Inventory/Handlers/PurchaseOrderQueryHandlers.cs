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
/// HANDLER xử lý các yêu cầu truy vấn thông tin Phiếu nhập kho (GetById, GetAll/Search).
/// </summary>
public class PurchaseOrderQueryHandlers :
    IRequestHandler<GetPurchaseOrderByIdQuery, PurchaseOrderDto>,
    IRequestHandler<GetPurchaseOrdersQuery, IEnumerable<PurchaseOrderDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public PurchaseOrderQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy chi tiết thông tin Phiếu nhập kho theo ID kèm danh sách Items chi tiết.
    /// </summary>
    public async Task<PurchaseOrderDto> Handle(GetPurchaseOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var itemRepo = _unitOfWork.Repository<PurchaseOrderItemEntity>();
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải phiếu nhập chính
        var po = await poRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (po == null)
        {
            throw new NotFoundException("Phiếu nhập kho", request.Id);
        }

        // 2. Tải Nhà cung cấp & Kho hàng liên kết
        var supplier = await supplierRepo.GetByIdAsNoTrackingAsync(po.SupplierId, cancellationToken);
        var warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(po.WarehouseId, cancellationToken);

        // 3. Tải tất cả chi tiết mặt hàng của phiếu nhập
        var items = await itemRepo.FindAsNoTrackingAsync(i => i.PurchaseOrderId == po.Id, cancellationToken);

        // 4. Ánh xạ phiếu chính sang DTO
        var dto = po.Adapt<PurchaseOrderDto>();
        dto.SupplierName = supplier?.Name ?? "Không xác định";
        dto.WarehouseName = warehouse?.Name ?? "Không xác định";
        dto.Status = po.Status.ToString();
        dto.Items = new List<PurchaseOrderItemDto>();

        // 5. Nạp thông tin biến thể sản phẩm cho từng Item
        foreach (var item in items)
        {
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(item.ProductVariantId, cancellationToken);
            var itemDto = item.Adapt<PurchaseOrderItemDto>();
            itemDto.VariantName = variant?.Name ?? "Mặt hàng không tồn tại";
            itemDto.Sku = variant?.Sku ?? string.Empty;
            dto.Items.Add(itemDto);
        }

        return dto;
    }

    /// <summary>
    /// Lấy danh sách các Phiếu nhập kho kèm theo bộ lọc tìm kiếm.
    /// </summary>
    public async Task<IEnumerable<PurchaseOrderDto>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var itemRepo = _unitOfWork.Repository<PurchaseOrderItemEntity>();
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải toàn bộ Phiếu nhập kho không theo dõi lên RAM
        var pos = await poRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // 2. Áp dụng các điều kiện lọc (nếu có) trên RAM
        if (request.SupplierId.HasValue)
        {
            pos = pos.Where(x => x.SupplierId == request.SupplierId.Value);
        }

        if (request.WarehouseId.HasValue)
        {
            pos = pos.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            pos = pos.Where(x => x.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        // 3. Tải trước toàn bộ dữ liệu danh mục phụ trợ lên RAM để tối ưu hóa hiệu năng (tránh truy vấn N+1)
        var suppliers = await supplierRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var warehouses = await warehouseRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var items = await itemRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // Tạo maps tra cứu nhanh
        var supplierMap = suppliers.ToDictionary(s => s.Id, s => s.Name);
        var warehouseMap = warehouses.ToDictionary(w => w.Id, w => w.Name);
        var variantMap = variants.ToDictionary(v => v.Id, v => v);
        var itemsGroup = items.GroupBy(i => i.PurchaseOrderId).ToDictionary(g => g.Key, g => g.ToList());

        // 4. Ánh xạ danh sách phiếu nhập sang DTO
        var dtos = pos.Select(po =>
        {
            var dto = po.Adapt<PurchaseOrderDto>();
            dto.Status = po.Status.ToString();

            // Gán tên Nhà cung cấp
            if (supplierMap.TryGetValue(po.SupplierId, out var supplierName))
            {
                dto.SupplierName = supplierName;
            }
            else
            {
                dto.SupplierName = "Không xác định";
            }

            // Gán tên Kho
            if (warehouseMap.TryGetValue(po.WarehouseId, out var warehouseName))
            {
                dto.WarehouseName = warehouseName;
            }
            else
            {
                dto.WarehouseName = "Không xác định";
            }

            // Lấy danh sách Items và gán tên biến thể sản phẩm
            if (itemsGroup.TryGetValue(po.Id, out var poItems))
            {
                dto.Items = poItems.Select(item =>
                {
                    var itemDto = item.Adapt<PurchaseOrderItemDto>();
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
