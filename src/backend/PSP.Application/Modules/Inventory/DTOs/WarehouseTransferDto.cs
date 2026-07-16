using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.DTOs;

/// <summary>
/// DTO chứa thông tin chi tiết của một Phiếu điều chuyển kho (Warehouse Transfer).
/// </summary>
public class WarehouseTransferDto
{
    public Guid Id { get; set; }
    
    public Guid FromWarehouseId { get; set; }
    
    /// <summary>
    /// Tên kho xuất hàng
    /// </summary>
    public string FromWarehouseName { get; set; } = string.Empty;
    
    public Guid ToWarehouseId { get; set; }
    
    /// <summary>
    /// Tên kho nhận hàng
    /// </summary>
    public string ToWarehouseName { get; set; } = string.Empty;
    
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Trạng thái dạng text (Pending, InTransit, Received, Cancelled)
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Danh sách các sản phẩm điều chuyển
    /// </summary>
    public List<WarehouseTransferItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO chứa thông tin chi tiết dòng sản phẩm trong Phiếu điều chuyển.
/// </summary>
public class WarehouseTransferItemDto
{
    public Guid Id { get; set; }
    
    public Guid ProductVariantId { get; set; }
    
    /// <summary>
    /// Tên biến thể sản phẩm điều chuyển
    /// </summary>
    public string VariantName { get; set; } = string.Empty;
    
    /// <summary>
    /// Mã SKU biến thể
    /// </summary>
    public string Sku { get; set; } = string.Empty;
    
    public int Quantity { get; set; }
}
