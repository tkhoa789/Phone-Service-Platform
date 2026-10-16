using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Warranty.DTOs;

/// <summary>
/// DTO đại diện cho Phiếu bảo hành.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này định dạng dữ liệu trả về cho Client.
/// - Tránh trả trực tiếp Entity để ngăn ngừa lỗi vòng lặp tham chiếu và ẩn thông tin nhạy cảm.
/// </summary>
public class WarrantyTicketDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    public Guid? SalesOrderId { get; set; }
    public string? SalesOrderCode { get; set; }

    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;

    public string? Imei { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Note { get; set; }

    // Workflow fields
    public string? RejectReason { get; set; }
    public string? RejectNotes { get; set; }
    public string? EvidencePhotoUrls { get; set; }
    public bool TransferToPaidRepair { get; set; }
    public Guid? RepairTicketId { get; set; }
    public string? RepairTicketCode { get; set; }
    public string? VendorName { get; set; }
    public string? VendorTicketNumber { get; set; }
    public string? TrackingNumber { get; set; }
    public string? VendorSubStatus { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public List<WarrantyHistoryDto> Histories { get; set; } = new();
}

/// <summary>
/// DTO đại diện cho Lịch sử xử lý bảo hành.
/// </summary>
public class WarrantyHistoryDto
{
    public Guid Id { get; set; }
    public Guid WarrantyTicketId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// DTO phản hồi kết quả kiểm tra thời hạn bảo hành của thiết bị qua số IMEI.
/// </summary>
public class WarrantyCheckResultDto
{
    public string Imei { get; set; } = string.Empty;
    public bool IsUnderWarranty { get; set; }
    public string WarrantyStatus { get; set; } = string.Empty; // "Active", "Expired", "NotFound"
    public int RemainingDays { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpirationDate { get; set; }
    public Guid? ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public Guid? SalesOrderId { get; set; }
    public string? SalesOrderCode { get; set; }
    public string CurrentImeiStatus { get; set; } = string.Empty;
}
