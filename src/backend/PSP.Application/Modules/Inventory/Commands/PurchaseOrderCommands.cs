using MediatR;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.Commands;

/// <summary>
/// COMMAND tạo mới Phiếu nhập kho.
/// Trả về Guid của phiếu nhập vừa được tạo.
/// </summary>
public record CreatePurchaseOrderCommand : IRequest<Guid>
{
    public Guid SupplierId { get; init; }
    
    public Guid WarehouseId { get; init; }
    
    public string Code { get; init; } = string.Empty;
    
    /// <summary>
    /// Danh sách các mặt hàng cần nhập
    /// </summary>
    public List<CreatePurchaseOrderItemCommand> Items { get; init; } = new();
}

/// <summary>
/// Dòng mặt hàng khi tạo mới phiếu nhập.
/// </summary>
public record CreatePurchaseOrderItemCommand
{
    public Guid ProductVariantId { get; init; }
    
    public int Quantity { get; init; }
    
    public decimal UnitPrice { get; init; }
}

/// <summary>
/// COMMAND cập nhật thông tin Phiếu nhập kho (Chỉ được sửa khi ở trạng thái Draft).
/// </summary>
public record UpdatePurchaseOrderCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    public Guid SupplierId { get; init; }
    
    public Guid WarehouseId { get; init; }
    
    public List<CreatePurchaseOrderItemCommand> Items { get; init; } = new();
}

/// <summary>
/// COMMAND hoàn tất nhập kho (Nhận hàng thành công - Status = Received).
/// Thực hiện cộng tồn kho khả dụng và đăng ký danh sách IMEI.
/// </summary>
public record CompletePurchaseOrderCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    /// <summary>
    /// Danh sách mã số IMEI được khai báo/quét thủ công khi nhận máy.
    /// Đối với các sản phẩm điện thoại (Category MOBILE), bắt buộc truyền đúng số lượng.
    /// </summary>
    public List<ProductVariantImeisDto> VariantImeis { get; init; } = new();
}

/// <summary>
/// Cấu trúc đóng gói danh sách IMEI ứng với từng biến thể sản phẩm.
/// </summary>
public class ProductVariantImeisDto
{
    public Guid ProductVariantId { get; set; }
    
    public List<string> Imeis { get; set; } = new();
}

/// <summary>
/// COMMAND hủy phiếu nhập kho (Draft/Confirmed -> Cancelled).
/// </summary>
public record CancelPurchaseOrderCommand(Guid Id) : IRequest<bool>;

/// <summary>
/// COMMAND xóa mềm phiếu nhập kho (Chỉ áp dụng cho phiếu ở trạng thái Draft).
/// </summary>
public record DeletePurchaseOrderCommand(Guid Id) : IRequest<bool>;
