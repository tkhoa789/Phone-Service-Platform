using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Repair.DTOs;

/// <summary>
/// Data Transfer Object (DTO) đại diện cho Phiếu sửa chữa.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Class này dùng để định dạng dữ liệu trả về cho Client thông qua API.
/// - Không trả trực tiếp Entity ra ngoài để bảo mật thông tin và tránh lỗi vòng lặp tham chiếu EF Core.
/// </summary>
public class RepairTicketDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;

    public string? Imei { get; set; }
    public Guid ReceivedById { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;

    public Guid? TechnicianId { get; set; }
    public string? TechnicianName { get; set; }

    public string Code { get; set; } = string.Empty;
    public string TicketCode => Code;
    public string DeviceModel => CustomModelName ?? ProductName;
    public string Status { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;
    public string? ExteriorCondition { get; set; }
    public string? CustomModelName { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    
    // Tính tổng tiền công sửa chữa + linh kiện thay thế
    public decimal LaborCost { get; set; } // Tiền công thợ sửa (Ví dụ: ActualCost hoặc EstimatedCost)
    public decimal PartsTotal { get; set; } // Tổng tiền linh kiện
    public decimal TotalAmount => LaborCost + PartsTotal; // Tổng chi phí khách phải trả

    public DateTime ReceivedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    
    // Diagnosis Fields (Section 5)
    public string? DiagnosisRootCause { get; set; }
    public string? DiagnosisProposedSolution { get; set; }
    public int? EstimatedDays { get; set; }
    public string? TechnicalNotes { get; set; }
    public DateTime? DiagnosedAt { get; set; }
    public Guid? DiagnosedById { get; set; }
    public string? DiagnosedByName { get; set; }

    // Customer Approval Fields (Section 6)
    public string? CustomerApprovalStatus { get; set; }
    public DateTime? CustomerApprovedAt { get; set; }
    public Guid? CustomerApprovedById { get; set; }
    public string? CustomerApprovedByName { get; set; }
    public string? CustomerApprovalMethod { get; set; }
    public decimal? CustomerApprovedAmount { get; set; }
    public string? CustomerApprovalNote { get; set; }

    // Delivery Fields (Section 12)
    public Guid? DeliveredById { get; set; }
    public string? DeliveredByName { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? DeliveredToCustomerName { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? DeliverySignatureUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public bool IsTest { get; set; } = false;
    
    public List<RepairPartDto> Parts { get; set; } = new();
    public List<RepairStatusHistoryDto> StatusHistories { get; set; } = new();
    public List<RepairChecklistDto> Checklists { get; set; } = new();
    public List<RepairDepositDto> Deposits { get; set; } = new();
}

/// <summary>
/// DTO đại diện cho Linh kiện thay thế trong Phiếu sửa chữa.
/// </summary>
public class RepairPartDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
    public string Status { get; set; } = string.Empty;
    public string? AddedBy { get; set; }
    public DateTime AddedAt { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

/// <summary>
/// DTO đại diện cho Lịch sử chuyển trạng thái sửa chữa & Audit Event.
/// </summary>
public class RepairStatusHistoryDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? Action { get; set; }
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class RepairChecklistDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid InspectorId { get; set; }
    public string InspectorName { get; set; } = string.Empty;
    public DateTime InspectedAt { get; set; }
    public string? CustomerSignatureUrl { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RepairChecklistItemDto> Items { get; set; } = new();
}

public class RepairChecklistItemDto
{
    public Guid Id { get; set; }
    public string CheckPointName { get; set; } = string.Empty;
    public bool IsPassed { get; set; }
    public string? IssueDescription { get; set; }
}

public class RepairDepositDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public decimal Amount { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public string? TransactionCode { get; set; }
    public Guid ReceivedById { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? AppliedToInvoiceId { get; set; }
    
    // Idempotency support
    public string IdempotencyKey { get; set; } = string.Empty;
}

/// <summary>
/// DTO chứa các số liệu thống kê hàng chờ sửa chữa chính xác từ Database.
/// </summary>
public class RepairQueueStatsDto
{
    public int UnassignedCount { get; set; }
    public int MyTasksCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int DeliveredCount { get; set; }
    public int TotalCount { get; set; }

    // Chi tiết các trạng thái kỹ thuật phục vụ Dashboard & Exception Panels (100% Database)
    public int WaitingForPartsCount { get; set; }
    public int WaitingApprovalCount { get; set; }
    public int DiagnosingCount { get; set; }
    public int RepairingCount { get; set; }
    public int WaitingQcCount { get; set; }
}
