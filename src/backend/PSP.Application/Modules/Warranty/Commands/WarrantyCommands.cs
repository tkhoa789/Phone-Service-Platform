using System;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Warranty.Commands;

/// <summary>
/// Lệnh tiếp nhận bảo hành thiết bị và lập Phiếu bảo hành mới.
/// </summary>
public record CreateWarrantyTicketCommand(
    Guid CustomerId,
    Guid ProductVariantId,
    string Imei,
    string? Note
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật trạng thái xử lý bảo hành.
/// Hỗ trợ kịch bản đổi máy mới (BR-905).
/// </summary>
public record UpdateWarrantyStatusCommand(
    Guid WarrantyTicketId,
    WarrantyTicketStatus Status,
    string Action,
    string? Description,
    string? NewImei = null,
    byte[] RowVersion = null!
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa phiếu bảo hành (chỉ cho phép khi ở trạng thái Received và chưa có lịch sử xử lý phức tạp).
/// </summary>
public record DeleteWarrantyTicketCommand(Guid Id, byte[] RowVersion) : IRequest<bool>;
