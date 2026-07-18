using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Domain.Modules.Sales.Entities;

/// <summary>
/// Chương trình khuyến mãi.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class PromotionEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; }
    public decimal Value { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public ICollection<VoucherEntity> Vouchers { get; set; } = new List<VoucherEntity>();
}

/// <summary>
/// Voucher giảm giá.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class VoucherEntity : BaseEntity
{
    public Guid PromotionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public VoucherStatus Status { get; set; } = VoucherStatus.Active;
    public decimal DiscountAmount { get; set; }
    public decimal MinOrderValue { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int UsageLimit { get; set; }
    public int UsageCount { get; set; }

    // Navigation Properties
    public PromotionEntity Promotion { get; set; } = null!;
}

/// <summary>
/// Đơn hàng bán.
/// Tuân thủ BR-SALE-02: Giá bán chốt trên đơn hàng là giá tại thời điểm tạo đơn.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class SalesOrderEntity : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid UserId { get; set; }
    public Guid BranchId { get; set; }
    public Guid? VoucherId { get; set; }
    public string Code { get; set; } = string.Empty;
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Pending;
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }

    // Navigation Properties
    public CustomerEntity Customer { get; set; } = null!;
    public UserEntity User { get; set; } = null!;
    public BranchEntity Branch { get; set; } = null!;
    public VoucherEntity? Voucher { get; set; }
    public ICollection<SalesOrderItemEntity> Items { get; set; } = new List<SalesOrderItemEntity>();
    public InvoiceEntity? Invoice { get; set; }
}

/// <summary>
/// Chi tiết đơn hàng bán.
/// Tuân thủ BR-INV-03: Khi bán phải gắn đúng IMEI xuất kho vào chi tiết đơn hàng.
/// </summary>
public class SalesOrderItemEntity : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string? Imei { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }

    // Navigation Properties
    public SalesOrderEntity SalesOrder { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// Hóa đơn.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class InvoiceEntity : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public string Code { get; set; } = string.Empty;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public decimal Amount { get; set; }

    // Navigation Properties
    public SalesOrderEntity SalesOrder { get; set; } = null!;
    public ICollection<InvoiceItemEntity> Items { get; set; } = new List<InvoiceItemEntity>();
    public ICollection<PaymentEntity> Payments { get; set; } = new List<PaymentEntity>();
}

public class InvoiceItemEntity : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Navigation Properties
    public InvoiceEntity Invoice { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// Phương thức thanh toán.
/// </summary>
public class PaymentMethodEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Thanh toán.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class PaymentEntity : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime PaymentDate { get; set; }

    // Navigation Properties
    public InvoiceEntity Invoice { get; set; } = null!;
    public PaymentMethodEntity PaymentMethod { get; set; } = null!;
}
