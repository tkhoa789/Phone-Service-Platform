using PSP.Domain.Common.Entities;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Domain.Modules.Product.Entities;

/// <summary>
/// Danh mục sản phẩm (hỗ trợ danh mục đa cấp qua parent_id).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class CategoryEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }

    // Navigation Properties
    public CategoryEntity? Parent { get; set; }
    public ICollection<CategoryEntity> Children { get; set; } = new List<CategoryEntity>();
    public ICollection<ProductEntity> Products { get; set; } = new List<ProductEntity>();
}

/// <summary>
/// Thương hiệu sản phẩm (Apple, Samsung, Xiaomi...).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class BrandEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    // Navigation Properties
    public ICollection<ProductEntity> Products { get; set; } = new List<ProductEntity>();
}

/// <summary>
/// Sản phẩm (iPhone 16, Galaxy S25...).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class ProductEntity : BaseEntity
{
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation Properties
    public CategoryEntity Category { get; set; } = null!;
    public BrandEntity Brand { get; set; } = null!;
    public ICollection<ProductVariantEntity> Variants { get; set; } = new List<ProductVariantEntity>();
}

/// <summary>
/// Biến thể sản phẩm (màu sắc, dung lượng, giá).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class ProductVariantEntity : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Capacity { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }

    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation Properties
    public ProductEntity Product { get; set; } = null!;
    public ICollection<ImeiEntity> Imeis { get; set; } = new List<ImeiEntity>();
}

/// <summary>
/// Nhà cung cấp linh kiện / máy thiết bị.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class SupplierEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxCode { get; set; }
    public decimal DebtAmount { get; set; }
    public decimal CreditLimit { get; set; } = 500000000;
    public int PaymentTermsDays { get; set; } = 30;

    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation Properties
    public ICollection<SupplierDebtTransactionEntity> DebtTransactions { get; set; } = new List<SupplierDebtTransactionEntity>();
}

/// <summary>
/// Thực thể ghi nhận Sổ Giao Dịch & Lịch Sử Công Nợ Nhà Cung Cấp.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class SupplierDebtTransactionEntity : BaseEntity
{
    public Guid SupplierId { get; set; }
    public string TransactionType { get; set; } = "PAYMENT"; // INVOICE, PAYMENT, DEBIT_NOTE
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; } // CASH, VIETQR, BANK_TRANSFER
    public string? Note { get; set; }

    // Navigation Properties
    public SupplierEntity Supplier { get; set; } = null!;
}
