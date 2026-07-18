using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Sales.DTOs;

namespace PSP.Application.Modules.Sales.Queries;

/// <summary>
/// Các câu hỏi (Queries) dùng để ĐỌC dữ liệu từ bảng Vouchers (Mã giảm giá).
/// </summary>

/// <summary>
/// Lấy thông tin chi tiết một Voucher theo ID.
/// </summary>
public record GetVoucherByIdQuery(Guid Id) : IRequest<VoucherDto>;

/// <summary>
/// Tìm kiếm Voucher theo mã Code (ví dụ người dùng gõ nhập: "GIAM50K").
/// </summary>
public record GetVoucherByCodeQuery(string Code) : IRequest<VoucherDto>;

/// <summary>
/// Lấy toàn bộ danh sách Voucher của hệ thống.
/// </summary>
public record GetAllVouchersQuery : IRequest<IEnumerable<VoucherDto>>;

/// <summary>
/// API vô cùng quan trọng: Kiểm tra tính hợp lệ của mã Voucher cho một giá trị đơn hàng cụ thể.
/// - Trả về thông tin VoucherDto nếu hợp lệ.
/// - Ném ra BusinessException nếu Voucher hết hạn, hết lượt, trạng thái không khả dụng hoặc chưa đủ điều kiện giá trị đơn hàng tối thiểu.
/// </summary>
public record ValidateVoucherQuery(string Code, decimal OrderValue) : IRequest<VoucherDto>;
