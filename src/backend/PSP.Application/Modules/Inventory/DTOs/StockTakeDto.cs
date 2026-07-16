using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Inventory.DTOs;

/// <summary>
/// DTO chứa thông tin chi tiết Phiếu kiểm kê kho (StockTake).
/// </summary>
public class StockTakeDto
{
    public Guid Id { get; set; }
    
    public Guid WarehouseId { get; set; }
    
    /// <summary>
    /// Tên kho hàng được kiểm kê
    /// </summary>
    public string WarehouseName { get; set; } = string.Empty;
    
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Trạng thái dạng text (Draft, InProgress, Completed, Cancelled)
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Danh sách chi tiết các mặt hàng kiểm kê
    /// </summary>
    public List<StockTakeItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO chứa thông tin chi tiết của một dòng sản phẩm trong Phiếu kiểm kê.
/// </summary>
public class StockTakeItemDto
{
    public Guid Id { get; set; }
    
    public Guid ProductVariantId { get; set; }
    
    /// <summary>
    /// Tên biến thể sản phẩm kiểm kê
    /// </summary>
    public string VariantName { get; set; } = string.Empty;
    
    /// <summary>
    /// Mã SKU biến thể
    /// </summary>
    public string Sku { get; set; } = string.Empty;
    
    /// <summary>
    /// Số lượng tồn kho ghi nhận trên phần mềm tại thời điểm lập phiếu
    /// </summary>
    public int SystemQuantity { get; set; }
    
    /// <summary>
    /// Số lượng thực tế kiểm đếm được tại kho vật lý
    /// </summary>
    public int ActualQuantity { get; set; }
    
    /// <summary>
    /// Độ chênh lệch (ActualQuantity - SystemQuantity)
    /// </summary>
    public int Difference { get; set; }
    
    /// <summary>
    /// Ghi chú chênh lệch (ví dụ: thất thoát, hư hỏng...)
    /// </summary>
    public string? Note { get; set; }
}
