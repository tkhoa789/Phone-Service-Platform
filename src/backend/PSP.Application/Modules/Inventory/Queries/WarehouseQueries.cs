using MediatR;
using PSP.Application.Modules.Inventory.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Queries;

/// <summary>
/// QUERY lấy chi tiết một kho hàng theo ID.
/// Trả về đối tượng DTO chứa thông tin kho và tên chi nhánh tương ứng.
/// </summary>
public record GetWarehouseByIdQuery(Guid Id) : IRequest<WarehouseDto>;

/// <summary>
/// QUERY lấy danh sách tất cả các kho hàng thuộc về một chi nhánh cụ thể.
/// </summary>
public record GetWarehousesByBranchIdQuery(Guid BranchId) : IRequest<IEnumerable<WarehouseDto>>;

/// <summary>
/// QUERY lấy danh sách tất cả các kho hàng đang hoạt động trong toàn bộ hệ thống.
/// </summary>
public record GetWarehousesQuery : IRequest<IEnumerable<WarehouseDto>>;
