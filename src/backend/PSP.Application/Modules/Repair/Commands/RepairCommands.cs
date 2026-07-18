using System;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Repair.Commands;

/// <summary>
/// Lệnh tiếp nhận thiết bị lỗi và tạo Phiếu sửa chữa mới.
/// </summary>
public record CreateRepairTicketCommand(
    Guid CustomerId,
    Guid ProductVariantId,
    string? Imei,
    string ProblemDescription,
    decimal? EstimatedCost,
    Guid? TechnicianId
) : IRequest<Guid>;

/// <summary>
/// Lệnh xuất/thêm linh kiện thay thế từ kho vào Phiếu sửa chữa.
/// </summary>
public record AddRepairPartCommand(
    Guid RepairTicketId,
    Guid ProductVariantId,
    int Quantity
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật trạng thái sửa chữa của thiết bị (tiến trạng thái tuyến tính).
/// </summary>
public record UpdateRepairStatusCommand(
    Guid RepairTicketId,
    RepairTicketStatus Status,
    string? Note,
    decimal? ActualCost,
    Guid? TechnicianId
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa phiếu sửa chữa (chỉ cho phép khi ở trạng thái Received và chưa xuất linh kiện).
/// </summary>
public record DeleteRepairTicketCommand(Guid Id) : IRequest<bool>;
