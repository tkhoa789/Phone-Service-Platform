using MediatR;
using PSP.Application.Modules.Inventory.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Queries;

/// <summary>
/// QUERY lấy thông tin chi tiết một Phiếu nhập kho kèm các dòng Items.
/// </summary>
public record GetPurchaseOrderByIdQuery(Guid Id) : IRequest<PurchaseOrderDto>;

/// <summary>
/// QUERY lấy danh sách Phiếu nhập kho kèm các bộ lọc tùy chọn.
/// </summary>
public record GetPurchaseOrdersQuery(
    Guid? SupplierId = null,
    Guid? WarehouseId = null,
    string? Status = null
) : IRequest<IEnumerable<PurchaseOrderDto>>;
