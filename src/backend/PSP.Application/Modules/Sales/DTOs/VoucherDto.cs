using System;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO (Data Transfer Object) cho Voucher (Mã giảm giá).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này giúp đóng gói dữ liệu của Voucher để gửi đi.
/// - Có thêm thuộc tính PromotionCode và PromotionName được bóc tách phẳng từ Promotion liên kết 
///   để giúp giao diện người dùng hiển thị thông tin chương trình khuyến mãi đi kèm nhanh chóng mà không cần gọi thêm API khác.
/// </summary>
public record VoucherDto
{
    public Guid Id { get; init; }
    public Guid PromotionId { get; init; }
    
    // Mã của chương trình khuyến mãi cha
    public string PromotionCode { get; init; } = string.Empty;
    
    // Tên của chương trình khuyến mãi cha
    public string PromotionName { get; init; } = string.Empty;
    
    // Mã code nhập vào khi thanh toán (ví dụ: VIP100K)
    public string Code { get; init; } = string.Empty;
    
    // Trạng thái Voucher: Active (còn dùng được), Used (đã dùng), Expired (hết hạn), Cancelled (bị hủy)
    public VoucherStatus Status { get; init; }
    
    // Số tiền giảm giá thực tế (bằng tiền mặt)
    public decimal DiscountAmount { get; init; }
    
    // Giá trị đơn hàng tối thiểu bắt buộc để có thể áp dụng mã Voucher này
    public decimal MinOrderValue { get; init; }
    
    // Hạn chót sử dụng Voucher
    public DateTime ExpiryDate { get; init; }
    
    // Giới hạn lượt sử dụng tối đa
    public int UsageLimit { get; init; }
    
    // Số lượt đã dùng thực tế
    public int UsageCount { get; init; }
    
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
