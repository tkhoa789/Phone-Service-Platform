using MediatR;
using PSP.Application.Modules.Inventory.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Queries;

/// <summary>
/// QUERY lấy thông tin chi tiết một Phiếu điều chuyển kho kèm danh sách chi tiết mặt hàng.
/// </summary>
public record GetWarehouseTransferByIdQuery(Guid Id) : IRequest<WarehouseTransferDto>;

/// <summary>
/// QUERY lấy danh sách Phiếu điều chuyển kho kèm theo các bộ lọc tùy chọn.
/// </summary>
public record GetWarehouseTransfersQuery(
    Guid? FromWarehouseId = null,
    Guid? ToWarehouseId = null,
    string? Status = null
) : IRequest<IEnumerable<WarehouseTransferDto>>;
