using MediatR;
using PSP.Application.Modules.Inventory.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Queries;

/// <summary>
/// QUERY lấy chi tiết một Phiếu kiểm kê kho kèm danh sách chi tiết mặt hàng kiểm đếm.
/// </summary>
public record GetStockTakeByIdQuery(Guid Id) : IRequest<StockTakeDto>;

/// <summary>
/// QUERY lấy danh sách Phiếu kiểm kê kho kèm theo các bộ lọc tùy chọn.
/// </summary>
public record GetStockTakesQuery(
    Guid? WarehouseId = null,
    string? Status = null
) : IRequest<IEnumerable<StockTakeDto>>;
