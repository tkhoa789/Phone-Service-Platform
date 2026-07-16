using MediatR;
using System;

namespace PSP.Application.Modules.Inventory.Commands;

/// <summary>
/// COMMAND cập nhật định mức tồn kho tối thiểu cho một dòng sản phẩm tại một kho.
/// </summary>
public record UpdateInventoryMinStockCommand(Guid Id, int MinimumStock) : IRequest<bool>;

/// <summary>
/// COMMAND cập nhật trạng thái của một mã IMEI (Ví dụ: chuyển sang Repairing, Disposed, v.v.).
/// </summary>
public record UpdateImeiStatusCommand(string Imei, string Status) : IRequest<bool>;
