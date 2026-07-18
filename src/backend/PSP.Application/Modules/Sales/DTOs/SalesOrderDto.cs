using System;
using System.Collections.Generic;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO Đơn hàng bán lẻ (SalesOrder).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này biểu diễn dữ liệu của đơn hàng.
/// - Nó làm phẳng các quan hệ liên kết phức tạp thành tên khách hàng, tên nhân viên, tên chi nhánh, mã voucher để dễ hiển thị.
/// - Chứa danh sách các mặt hàng con nằm trong đơn hàng thông qua Items.
/// </summary>
public record SalesOrderDto
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    
    // Họ và tên khách hàng để hiển thị trực quan
    public string CustomerName { get; init; } = string.Empty;
    
    // Số điện thoại khách hàng
    public string CustomerPhone { get; init; } = string.Empty;

    public Guid UserId { get; init; }
    
    // Họ tên nhân viên tạo đơn hàng
    public string UserFullName { get; init; } = string.Empty;

    public Guid BranchId { get; init; }
    
    // Tên chi nhánh nơi phát sinh đơn hàng
    public string BranchName { get; init; } = string.Empty;

    public Guid? VoucherId { get; init; }
    
    // Chữ mã giảm giá (ví dụ: GIAM50K) nếu đơn hàng có áp dụng
    public string? VoucherCode { get; init; }

    public string Code { get; init; } = string.Empty;
    
    // Trạng thái đơn hàng (Pending, Confirmed, Completed, Cancelled)
    public SalesOrderStatus Status { get; init; }
    
    // Tổng số tiền trước khi giảm giá
    public decimal Subtotal { get; init; }
    
    // Số tiền giảm giá được chiết khấu nhờ áp dụng Voucher
    public decimal Discount { get; init; }
    
    // Tổng số tiền thực thu cuối cùng của đơn hàng
    public decimal Total { get; init; }

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }

    // Danh sách chi tiết các mặt hàng trong đơn hàng
    public IEnumerable<SalesOrderItemDto> Items { get; init; } = new List<SalesOrderItemDto>();
}
