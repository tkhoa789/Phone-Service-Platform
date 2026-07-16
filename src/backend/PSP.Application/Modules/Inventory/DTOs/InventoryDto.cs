using System;

namespace PSP.Application.Modules.Inventory.DTOs;

/// <summary>
/// DTO chứa thông tin số lượng tồn kho của một biến thể sản phẩm tại một kho cụ thể.
/// </summary>
public class InventoryDto
{
    public Guid Id { get; set; }
    
    public Guid WarehouseId { get; set; }
    
    public string WarehouseName { get; set; } = string.Empty;
    
    public Guid ProductVariantId { get; set; }
    
    public string VariantName { get; set; } = string.Empty;
    
    public string Sku { get; set; } = string.Empty;
    
    public int Quantity { get; set; }
    
    public int MinimumStock { get; set; }
    
    /// <summary>
    /// Cho biết số lượng thực tế có dưới ngưỡng tối thiểu cần cảnh báo hay không.
    /// </summary>
    public bool IsLowStock => Quantity <= MinimumStock;
}

/// <summary>
/// DTO chứa thông tin chi tiết của một mã IMEI (Mã định danh thiết bị).
/// </summary>
public class ImeiDto
{
    public Guid Id { get; set; }
    
    public string Imei { get; set; } = string.Empty;
    
    public Guid ProductVariantId { get; set; }
    
    public string VariantName { get; set; } = string.Empty;
    
    public string Sku { get; set; } = string.Empty;
    
    public Guid? WarehouseId { get; set; }
    
    public string WarehouseName { get; set; } = string.Empty;
    
    public string Status { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}
