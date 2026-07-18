using System;
using System.Collections.Generic;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Chi tiết Đơn hàng bán.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này biểu diễn thông tin phẳng của từng dòng sản phẩm được bán ra trong đơn hàng.
/// - Bao gồm tên sản phẩm và mã SKU để hiển thị lên màn hình.
/// </summary>
public record SalesOrderItemDto
{
    public Guid Id { get; init; }
    public Guid ProductVariantId { get; init; }
    
    // Tên đầy đủ của sản phẩm biến thể (e.g. iPhone 15 Pro Max - 256GB - Titan)
    public string ProductName { get; init; } = string.Empty;
    
    // Mã SKU của sản phẩm biến thể
    public string Sku { get; init; } = string.Empty;
    
    // Mã IMEI của máy bán ra (nếu là điện thoại di động)
    public string? Imei { get; init; }
    
    // Số lượng bán
    public int Quantity { get; init; }
    
    // Đơn giá bán lẻ chốt tại thời điểm mua
    public decimal UnitPrice { get; init; }
    
    // Số tiền giảm giá được chiết khấu trực tiếp trên sản phẩm này
    public decimal Discount { get; init; }
    
    // Tổng tiền của dòng này (được tính bằng: (Giá bán - Giảm giá) * Số lượng)
    public decimal Total => (UnitPrice - Discount) * Quantity;
}
