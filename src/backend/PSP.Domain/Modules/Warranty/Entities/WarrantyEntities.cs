using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Domain.Modules.Warranty.Entities;

/// <summary>
/// Phiếu bảo hành.
/// Tuân thủ BUSINESS_RULE_AI: IMEI bắt buộc phải còn trong thời hạn bảo hành
/// tính từ ngày bán (có trong hóa đơn mua hàng).
/// Tham chiếu: ERD.md - Section 3.4.
/// </summary>
public class WarrantyTicketEntity : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid? SalesOrderId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string? Imei { get; set; }
    public string Code { get; set; } = string.Empty;
    public WarrantyTicketStatus Status { get; set; } = WarrantyTicketStatus.Received;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Note { get; set; }

    // Nhánh 1: Từ chối bảo hành (Reject)
    public RejectReason? RejectReason { get; set; }
    public string? RejectNotes { get; set; }
    public string? EvidencePhotoUrls { get; set; }
    public bool TransferToPaidRepair { get; set; } = false;

    // Nhánh 2: Chuyển sửa chữa nội bộ (In-house Repair)
    public Guid? RepairTicketId { get; set; }

    // Nhánh 4: Gửi hãng ủy quyền (OEM Vendor RMA)
    public string? VendorName { get; set; }
    public string? VendorTicketNumber { get; set; }
    public string? TrackingNumber { get; set; }
    public VendorSubStatus? VendorSubStatus { get; set; }

    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation Properties
    public CustomerEntity Customer { get; set; } = null!;
    public SalesOrderEntity? SalesOrder { get; set; }
    public ProductVariantEntity ProductVariant { get; set; } = null!;
    public PSP.Domain.Modules.Repair.Entities.RepairTicketEntity? RepairTicket { get; set; }
    public ICollection<WarrantyHistoryEntity> Histories { get; set; } = new List<WarrantyHistoryEntity>();
}

/// <summary>
/// Lịch sử bảo hành.
/// </summary>
public class WarrantyHistoryEntity : BaseEntity
{
    public Guid WarrantyTicketId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Thông tin người thực hiện & ghi chú chi tiết
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public WarrantyTicketEntity WarrantyTicket { get; set; } = null!;
}

