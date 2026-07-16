using MediatR;
using PSP.Application.Modules.Inventory.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Queries;

/// <summary>
/// QUERY lấy danh sách số lượng tồn kho của các sản phẩm tại các kho hàng.
/// </summary>
public record GetWarehouseInventoriesQuery(
    Guid? WarehouseId = null,
    Guid? ProductVariantId = null,
    bool? IsLowStock = null
) : IRequest<IEnumerable<InventoryDto>>;

/// <summary>
/// QUERY lấy danh sách các mặt hàng có tồn kho dưới mức tối thiểu (cảnh báo nhập hàng).
/// </summary>
public record GetWarehouseLowStockQuery(Guid WarehouseId) : IRequest<IEnumerable<InventoryDto>>;

/// <summary>
/// QUERY tra cứu thông tin chi tiết và lịch sử của một mã số IMEI.
/// </summary>
public record GetImeiByNumberQuery(string Imei) : IRequest<ImeiDto>;

/// <summary>
/// QUERY lấy danh sách IMEI kèm bộ lọc tùy chọn.
/// </summary>
public record GetImeisQuery(
    Guid? WarehouseId = null,
    Guid? ProductVariantId = null,
    string? Status = null
) : IRequest<IEnumerable<ImeiDto>>;
