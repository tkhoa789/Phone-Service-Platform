using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.DTOs;

/// <summary>
/// DTO chứa thông tin chi tiết của một Phiếu nhập kho (Purchase Order).
/// </summary>
public class PurchaseOrderDto
{
    public Guid Id { get; set; }
    
    public Guid SupplierId { get; set; }
    
    /// <summary>
    /// Tên nhà cung cấp (nạp kèm hiển thị trực quan)
    /// </summary>
    public string SupplierName { get; set; } = string.Empty;
    
    public Guid WarehouseId { get; set; }
    
    /// <summary>
    /// Tên kho nhận hàng (nạp kèm hiển thị trực quan)
    /// </summary>
    public string WarehouseName { get; set; } = string.Empty;
    
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Trạng thái dạng text (Draft, Confirmed, Received, Cancelled)
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    public decimal TotalAmount { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Danh sách các dòng mặt hàng nhập trong phiếu
    /// </summary>
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO chứa thông tin chi tiết một dòng mặt hàng trong Phiếu nhập kho.
/// </summary>
public class PurchaseOrderItemDto
{
    public Guid Id { get; set; }
    
    public Guid ProductVariantId { get; set; }
    
    /// <summary>
    /// Tên biến thể sản phẩm (ví dụ: iPhone 16 Pro Max 256GB Titan Sa Mạc)
    /// </summary>
    public string VariantName { get; set; } = string.Empty;
    
    /// <summary>
    /// Mã SKU biến thể
    /// </summary>
    public string Sku { get; set; } = string.Empty;
    
    public int Quantity { get; set; }
    
    public decimal UnitPrice { get; set; }
    
    /// <summary>
    /// Thành tiền dòng mặt hàng (Quantity * UnitPrice)
    /// </summary>
    public decimal Amount => Quantity * UnitPrice;
}
