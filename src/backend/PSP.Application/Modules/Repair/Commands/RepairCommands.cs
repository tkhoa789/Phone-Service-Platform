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
    int Quantity,
    Guid? ImeiId = null,
    bool IssueImmediately = true
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật trạng thái sửa chữa của thiết bị (tiến trạng thái tuyến tính).
/// </summary>
public record UpdateRepairStatusCommand(
    Guid RepairTicketId,
    RepairTicketStatus Status,
    string? Note,
    Guid? TechnicianId
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa phiếu sửa chữa (chỉ cho phép khi ở trạng thái Received và chưa xuất linh kiện).
/// </summary>
public record DeleteRepairTicketCommand(Guid Id) : IRequest<bool>;

public record RepairPartDispositionDto(Guid RepairPartId, RepairPartStatus Disposition, string? Reason);

/// <summary>
/// Lệnh hủy phiếu sửa chữa, kèm theo quyết định xử lý (disposition) cho các linh kiện đã xuất.
/// </summary>
public record CancelRepairTicketCommand(
    Guid RepairTicketId,
    string? Note,
    List<RepairPartDispositionDto>? Dispositions
) : IRequest<bool>;

/// <summary>
/// Lệnh cập nhật trạng thái của một linh kiện thay thế (VD: Issue, Install)
/// </summary>
public record UpdateRepairPartStatusCommand(
    Guid RepairTicketId,
    Guid RepairPartId,
    RepairPartStatus Status,
    byte[] RowVersion
) : IRequest<bool>;

/// <summary>
/// Lệnh hoàn trả lại kho một linh kiện đã xuất.
/// </summary>
public record ReturnRepairPartCommand(
    Guid RepairTicketId,
    Guid RepairPartId,
    byte[] RowVersion
) : IRequest<bool>;

/// <summary>
/// Lệnh Write-Off (xóa sổ) một linh kiện đã xuất do hỏng/mất, ghi nhận chi phí.
/// </summary>
public record WriteOffRepairPartCommand(
    Guid RepairTicketId,
    Guid RepairPartId,
    string Reason,
    byte[] RowVersion
) : IRequest<bool>;
