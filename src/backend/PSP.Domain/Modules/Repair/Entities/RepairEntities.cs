using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Domain.Modules.Repair.Entities;

/// <summary>
/// Phiếu sửa chữa.
/// Tuân thủ BUSINESS_RULE_AI: Trạng thái chỉ được đi theo chiều tiến:
/// Tiếp nhận -> Chờ linh kiện -> Đang sửa -> Hoàn thành / Hủy
/// Tham chiếu: ERD.md - Section 3.4.
/// </summary>
public class RepairTicketEntity : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string? Imei { get; set; }
    public Guid? BranchId { get; set; }
    public Guid ReceivedById { get; set; }
    public Guid? TechnicianId { get; set; }
    public string Code { get; set; } = string.Empty;
    public RepairTicketStatus Status { get; set; } = RepairTicketStatus.Received;
    public string ProblemDescription { get; set; } = string.Empty;
    public string? ExteriorCondition { get; set; }
    public string? CustomModelName { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public decimal LaborCost { get; set; } = 0;
    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedDate { get; set; }
    public bool IsTest { get; set; } = false;

    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Diagnosis Information (Section 5)
    public string? DiagnosisRootCause { get; set; }
    public string? DiagnosisProposedSolution { get; set; }
    public int? EstimatedDays { get; set; }
    public string? TechnicalNotes { get; set; }
    public DateTime? DiagnosedAt { get; set; }
    public Guid? DiagnosedById { get; set; }

    // Customer Approval Information (Section 6)
    public string? CustomerApprovalStatus { get; set; } // "Pending", "Approved", "Rejected"
    public DateTime? CustomerApprovedAt { get; set; }
    public Guid? CustomerApprovedById { get; set; }
    public string? CustomerApprovalMethod { get; set; } // InPerson, Phone, SMS, Zalo, Web
    public decimal? CustomerApprovedAmount { get; set; }
    public string? CustomerApprovalNote { get; set; }

    // Delivery Information (Section 12)
    public Guid? DeliveredById { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? DeliveredToCustomerName { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? DeliverySignatureUrl { get; set; }

    // Liên kết bảo hành (nếu phiếu sửa chữa được chuyển từ quy trình thẩm định bảo hành)
    public Guid? WarrantyTicketId { get; set; }

    // Navigation Properties
    public CustomerEntity Customer { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
    public PSP.Domain.Modules.Branch.Entities.BranchEntity? Branch { get; set; }
    public UserEntity ReceivedBy { get; set; } = null!;
    public UserEntity? Technician { get; set; }
    public PSP.Domain.Modules.Warranty.Entities.WarrantyTicketEntity? WarrantyTicket { get; set; }
    public ICollection<RepairPartEntity> Parts { get; set; } = new List<RepairPartEntity>();
    public ICollection<RepairStatusHistoryEntity> StatusHistories { get; set; } = new List<RepairStatusHistoryEntity>();
    public ICollection<RepairChecklistEntity> Checklists { get; set; } = new List<RepairChecklistEntity>();
    public ICollection<RepairDepositEntity> Deposits { get; set; } = new List<RepairDepositEntity>();
}

/// <summary>
/// Linh kiện thay thế trong phiếu sửa chữa.
/// </summary>
public class RepairPartEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public Guid ProductVariantId { get; set; }
    public Guid? ImeiId { get; set; } // Hỗ trợ Serialized Part
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    
    public RepairPartStatus Status { get; set; } = RepairPartStatus.Reserved;
    public decimal? CostAtWriteOff { get; set; } // Snapshot giá vốn khi WriteOff
    
    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
    public ImeiEntity? Imei { get; set; }
}

/// <summary>
/// Lịch sử trạng thái phiếu sửa chữa.
/// </summary>
public class RepairStatusHistoryEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? Action { get; set; }
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? Details { get; set; }

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
}

/// <summary>
/// Loại checklist kiểm tra.
/// </summary>
public enum RepairChecklistType
{
    CheckIn,    // Lúc nhận máy
    CheckOut    // Lúc giao máy / QC
}

/// <summary>
/// Biên bản kiểm tra tình trạng máy (Checklist).
/// Hỗ trợ cả Check-In và Check-Out (BUS-002).
/// </summary>
public class RepairChecklistEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public RepairChecklistType Type { get; set; }
    public Guid InspectorId { get; set; }
    public DateTime InspectedAt { get; set; } = DateTime.UtcNow;
    public string? CustomerSignatureUrl { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
    public UserEntity Inspector { get; set; } = null!;
    public ICollection<RepairChecklistItemEntity> Items { get; set; } = new List<RepairChecklistItemEntity>();
}

/// <summary>
/// Các hạng mục kiểm tra trong biên bản.
/// VD: Display, Touch, FaceID, Camera, Speakers, Charging, Wifi, Body.
/// </summary>
public class RepairChecklistItemEntity : BaseEntity
{
    public Guid RepairChecklistId { get; set; }
    public string CheckPointName { get; set; } = string.Empty;
    public bool IsPassed { get; set; } = true;
    public string? IssueDescription { get; set; }

    // Navigation Properties
    public RepairChecklistEntity RepairChecklist { get; set; } = null!;
}

/// <summary>
/// Khoản tiền cọc (Deposit) cho phiếu sửa chữa.
/// Tuân thủ nguyên tắc tài chính: Không thay đổi/xóa dòng tiền cọc, chỉ chuyển trạng thái.
/// </summary>
public class RepairDepositEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public decimal Amount { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string? TransactionCode { get; set; }
    public Guid ReceivedById { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public RepairDepositStatus Status { get; set; } = RepairDepositStatus.Paid;
    public Guid? AppliedToInvoiceId { get; set; }
    
    // Idempotency support
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? RequestPayloadHash { get; set; } // To detect same-key + different-payload
    
    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
    public PSP.Domain.Modules.Sales.Entities.PaymentMethodEntity PaymentMethod { get; set; } = null!;
    public UserEntity ReceivedBy { get; set; } = null!;
}
