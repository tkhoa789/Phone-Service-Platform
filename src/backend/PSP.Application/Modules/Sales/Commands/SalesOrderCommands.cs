using System;
using System.Collections.Generic;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.Commands;

/// <summary>
/// DTO con đại diện cho từng dòng mặt hàng gửi lên khi lập đơn hàng.
/// </summary>
public record CreateSalesOrderItemCommand(
    Guid ProductVariantId,
    string? Imei,
    int Quantity
);

/// <summary>
/// Lệnh tạo mới một đơn hàng bán lẻ (SalesOrder).
/// 
/// Dành cho người mới học:
/// - Lệnh này chứa toàn bộ dữ liệu cần thiết để tạo một hóa đơn bán hàng.
/// - Trả về một Guid (ID của đơn hàng vừa tạo).
/// </summary>
public record CreateSalesOrderCommand(
    Guid CustomerId,
    string? VoucherCode, // Khách hàng nhập mã (ví dụ: GIAM50K), hệ thống tự tìm và đối soát
    List<CreateSalesOrderItemCommand> Items
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật trạng thái đơn hàng (ví dụ: từ Pending sang Completed hoặc Cancelled).
/// - Nghiệp vụ quan trọng: Khi chuyển sang Completed, hệ thống mới chính thức trừ kho vật lý và đổi trạng thái IMEI sang Sold.
/// </summary>
public record UpdateSalesOrderStatusCommand(
    Guid Id,
    SalesOrderStatus Status
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa đơn hàng (Xóa mềm).
/// </summary>
public record DeleteSalesOrderCommand(Guid Id) : IRequest<bool>;
