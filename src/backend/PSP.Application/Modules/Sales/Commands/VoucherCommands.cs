using System;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Sales.Commands;

/// <summary>
/// Lệnh tạo mới một mã Voucher giảm giá.
/// - IRequest<Guid>: Trả về Guid ID của Voucher sau khi tạo thành công.
/// </summary>
public record CreateVoucherCommand(
    Guid PromotionId,
    string Code,
    decimal DiscountAmount,
    decimal MinOrderValue,
    DateTime ExpiryDate,
    int UsageLimit
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật thông tin Voucher.
/// - Cho phép cập nhật cả trạng thái Voucher (Status).
/// </summary>
public record UpdateVoucherCommand(
    Guid Id,
    string Code,
    VoucherStatus Status,
    decimal DiscountAmount,
    decimal MinOrderValue,
    DateTime ExpiryDate,
    int UsageLimit
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa Voucher (Xóa mềm).
/// </summary>
public record DeleteVoucherCommand(Guid Id) : IRequest<bool>;
