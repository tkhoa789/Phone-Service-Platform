using MediatR;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Commands;

/// <summary>
/// COMMAND tạo mới Phiếu kiểm kê kho (Trạng thái mặc định là Draft).
/// </summary>
public record CreateStockTakeCommand : IRequest<Guid>
{
    public Guid WarehouseId { get; init; }
    
    public string? Code { get; init; } = null;
    
    /// <summary>
    /// Danh sách các sản phẩm kiểm kê đi kèm (Số lượng thực tế ban đầu có thể nhập trước hoặc điền sau)
    /// </summary>
    public List<CreateStockTakeItemCommand> Items { get; init; } = new();
}

/// <summary>
/// Mặt hàng đi kèm khi tạo phiếu kiểm kê.
/// </summary>
public record CreateStockTakeItemCommand
{
    public Guid ProductVariantId { get; init; }
    
    public int ActualQuantity { get; init; }
    
    public string? Note { get; init; }
}

/// <summary>
/// COMMAND cập nhật Phiếu kiểm kê (Chỉ áp dụng khi ở trạng thái Draft hoặc InProgress).
/// </summary>
public record UpdateStockTakeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    public List<CreateStockTakeItemCommand> Items { get; init; } = new();
}

/// <summary>
/// COMMAND bắt đầu kiểm kê kho (Draft -> InProgress).
/// </summary>
public record StartStockTakeCommand(Guid Id) : IRequest<bool>;

/// <summary>
/// COMMAND hoàn tất kiểm kê (InProgress -> Completed).
/// Thực hiện điều chỉnh số lượng tồn kho theo số liệu thực tế và đối soát danh sách IMEI.
/// </summary>
public record CompleteStockTakeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    /// <summary>
    /// Danh sách các IMEI thực tế kiểm đếm được tại kho cho mỗi biến thể sản phẩm kiểm kê.
    /// Đối với biến thể điện thoại di động (Category MOBILE), bắt buộc khai báo.
    /// </summary>
    public List<ProductVariantImeisDto> VariantImeis { get; init; } = new();
}

/// <summary>
/// COMMAND hủy phiếu kiểm kê kho (Draft/InProgress -> Cancelled).
/// </summary>
public record CancelStockTakeCommand(Guid Id) : IRequest<bool>;

/// <summary>
/// COMMAND xóa mềm phiếu kiểm kê kho (Chỉ áp dụng cho phiếu ở trạng thái Draft).
/// </summary>
public record DeleteStockTakeCommand(Guid Id) : IRequest<bool>;
