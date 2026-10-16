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

/// <summary>
/// Nhánh 1: Từ chối bảo hành do vi phạm chính sách (rơi vỡ, vào nước, can thiệp ngoài, hết hạn).
/// </summary>
public record RejectWarrantyCommand(
    Guid WarrantyTicketId,
    RejectReason Reason,
    string? RejectNotes,
    string? EvidencePhotoUrls,
    bool TransferToPaidRepair,
    byte[] RowVersion
) : IRequest<bool>;

/// <summary>
/// Nhánh 2: Chuyển sửa chữa nội bộ in-house (tự động lập phiếu sửa chữa RepairTicket với chi phí 0đ).
/// </summary>
public record TransferToInHouseRepairCommand(
    Guid WarrantyTicketId,
    string ComponentDiagnosis,
    Guid? TechnicianId,
    byte[] RowVersion
) : IRequest<Guid>;

/// <summary>
/// Nhánh 3: Đổi máy 1-1 theo quy chuẩn BR-905 (máy cũ chuyển Disposed, máy mới từ kho chuyển Sold).
/// </summary>
public record ReplaceDeviceCommand(
    Guid WarrantyTicketId,
    string NewImei,
    string? Reason,
    byte[] RowVersion
) : IRequest<bool>;

/// <summary>
/// Nhánh 4: Gửi máy sang Trung tâm bảo hành Hãng / Nhà cung cấp ủy quyền (OEM RMA).
/// </summary>
public record SendToVendorCommand(
    Guid WarrantyTicketId,
    string VendorName,
    string VendorTicketNumber,
    string TrackingNumber,
    string? Notes,
    byte[] RowVersion
) : IRequest<bool>;

/// <summary>
/// Bước kết thúc: Bàn giao thiết bị hoàn tất lại cho khách hàng.
/// </summary>
public record DeliverToCustomerCommand(
    Guid WarrantyTicketId,
    string? ReceiverName,
    string? Notes,
    byte[] RowVersion
) : IRequest<bool>;

public class DeleteWarrantyTicketRequest
{
    public Guid Id { get; set; }
    public byte[]? RowVersion { get; set; }
}

