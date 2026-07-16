using MediatR;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Commands;

/// <summary>
/// COMMAND tạo mới Phiếu điều chuyển kho.
/// Trả về Guid của phiếu điều chuyển vừa được tạo.
/// </summary>
public record CreateWarehouseTransferCommand : IRequest<Guid>
{
    public Guid FromWarehouseId { get; init; }
    
    public Guid ToWarehouseId { get; init; }
    
    public string Code { get; init; } = string.Empty;
    
    /// <summary>
    /// Danh sách các mặt hàng điều chuyển
    /// </summary>
    public List<CreateWarehouseTransferItemCommand> Items { get; init; } = new();
}

/// <summary>
/// Mặt hàng khi tạo phiếu điều chuyển.
/// </summary>
public record CreateWarehouseTransferItemCommand
{
    public Guid ProductVariantId { get; init; }
    
    public int Quantity { get; init; }
}

/// <summary>
/// COMMAND cập nhật Phiếu điều chuyển kho (Chỉ áp dụng khi ở trạng thái Pending).
/// </summary>
public record UpdateWarehouseTransferCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    public Guid FromWarehouseId { get; init; }
    
    public Guid ToWarehouseId { get; init; }
    
    public List<CreateWarehouseTransferItemCommand> Items { get; init; } = new();
}

/// <summary>
/// COMMAND giao hàng điều chuyển (Pending -> InTransit).
/// </summary>
public record ShipWarehouseTransferCommand(Guid Id) : IRequest<bool>;

/// <summary>
/// COMMAND nhận hàng điều chuyển thành công (InTransit -> Received).
/// Thực hiện xuất kho nguồn, nhập kho đích và đổi WarehouseId cho các IMEI tương ứng.
/// </summary>
public record ReceiveWarehouseTransferCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    /// <summary>
    /// Danh sách mã số IMEI được chọn điều chuyển ứng với từng biến thể sản phẩm.
    /// Bắt buộc đối với sản phẩm điện thoại di động (Category MOBILE).
    /// </summary>
    public List<ProductVariantImeisDto> VariantImeis { get; init; } = new();
}

/// <summary>
/// COMMAND hủy phiếu điều chuyển kho (Pending/InTransit -> Cancelled).
/// </summary>
public record CancelWarehouseTransferCommand(Guid Id) : IRequest<bool>;

/// <summary>
/// COMMAND xóa mềm phiếu điều chuyển kho (Chỉ áp dụng cho phiếu ở trạng thái Pending).
/// </summary>
public record DeleteWarehouseTransferCommand(Guid Id) : IRequest<bool>;
