using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
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
    public Guid ReceivedById { get; set; }
    public Guid? TechnicianId { get; set; }
    public string Code { get; set; } = string.Empty;
    public RepairTicketStatus Status { get; set; } = RepairTicketStatus.Received;
    public string ProblemDescription { get; set; } = string.Empty;
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public decimal LaborCost { get; set; } = 0;
    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedDate { get; set; }

    // Navigation Properties
    public CustomerEntity Customer { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
    public UserEntity ReceivedBy { get; set; } = null!;
    public UserEntity? Technician { get; set; }
    public ICollection<RepairPartEntity> Parts { get; set; } = new List<RepairPartEntity>();
    public ICollection<RepairStatusHistoryEntity> StatusHistories { get; set; } = new List<RepairStatusHistoryEntity>();
}

/// <summary>
/// Linh kiện thay thế trong phiếu sửa chữa.
/// </summary>
public class RepairPartEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// Lịch sử trạng thái phiếu sửa chữa.
/// </summary>
public class RepairStatusHistoryEntity : BaseEntity
{
    public Guid RepairTicketId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }

    // Navigation Properties
    public RepairTicketEntity RepairTicket { get; set; } = null!;
}
