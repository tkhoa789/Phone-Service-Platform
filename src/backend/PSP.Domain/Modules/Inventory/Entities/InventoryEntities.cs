using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Domain.Modules.Inventory.Entities;

/// <summary>
/// Kho hàng thuộc chi nhánh.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class WarehouseEntity : BaseEntity
{
    public Guid BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    // Navigation Properties
    public BranchEntity Branch { get; set; } = null!;
    public ICollection<InventoryEntity> Inventories { get; set; } = new List<InventoryEntity>();
    public ICollection<ImeiEntity> Imeis { get; set; } = new List<ImeiEntity>();
}

/// <summary>
/// Tồn kho (số lượng sản phẩm theo warehouse + variant).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class InventoryEntity : BaseEntity
{
    public Guid WarehouseId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public int MinimumStock { get; set; }

    // Navigation Properties
    public WarehouseEntity Warehouse { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// IMEI thiết bị - Quản lý đích danh từng sản phẩm.
/// Tuân thủ BR-INV-03: Sản phẩm điện thoại bắt buộc quản lý theo IMEI.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class ImeiEntity : BaseEntity
{
    public string Imei { get; set; } = string.Empty;
    public Guid ProductVariantId { get; set; }
    public Guid? WarehouseId { get; set; }
    public ImeiStatus Status { get; set; } = ImeiStatus.InStock;

    // Navigation Properties
    public ProductVariantEntity ProductVariant { get; set; } = null!;
    public WarehouseEntity? Warehouse { get; set; }
}

/// <summary>
/// Phiếu nhập kho (Purchase Order).
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class PurchaseOrderEntity : BaseEntity
{
    public Guid SupplierId { get; set; }
    public Guid WarehouseId { get; set; }
    public string Code { get; set; } = string.Empty;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public decimal TotalAmount { get; set; }

    // Navigation Properties
    public SupplierEntity Supplier { get; set; } = null!;
    public WarehouseEntity Warehouse { get; set; } = null!;
    public ICollection<PurchaseOrderItemEntity> Items { get; set; } = new List<PurchaseOrderItemEntity>();
}

/// <summary>
/// Chi tiết phiếu nhập kho.
/// </summary>
public class PurchaseOrderItemEntity : BaseEntity
{
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Navigation Properties
    public PurchaseOrderEntity PurchaseOrder { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// Phiếu chuyển kho giữa chi nhánh.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class WarehouseTransferEntity : BaseEntity
{
    public Guid FromWarehouseId { get; set; }
    public Guid ToWarehouseId { get; set; }
    public string Code { get; set; } = string.Empty;
    public WarehouseTransferStatus Status { get; set; } = WarehouseTransferStatus.Pending;

    // Navigation Properties
    public WarehouseEntity FromWarehouse { get; set; } = null!;
    public WarehouseEntity ToWarehouse { get; set; } = null!;
    public ICollection<WarehouseTransferItemEntity> Items { get; set; } = new List<WarehouseTransferItemEntity>();
}

public class WarehouseTransferItemEntity : BaseEntity
{
    public Guid TransferId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }

    // Navigation Properties
    public WarehouseTransferEntity Transfer { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}

/// <summary>
/// Phiếu kiểm kho.
/// Tham chiếu: ERD.md - Section 3.2.
/// </summary>
public class StockTakeEntity : BaseEntity
{
    public Guid WarehouseId { get; set; }
    public string Code { get; set; } = string.Empty;
    public StockTakeStatus Status { get; set; } = StockTakeStatus.Draft;

    // Navigation Properties
    public WarehouseEntity Warehouse { get; set; } = null!;
    public ICollection<StockTakeItemEntity> Items { get; set; } = new List<StockTakeItemEntity>();
}

public class StockTakeItemEntity : BaseEntity
{
    public Guid StockTakeId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int SystemQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int Difference { get; set; }
    public string? Note { get; set; }

    // Navigation Properties
    public StockTakeEntity StockTake { get; set; } = null!;
    public ProductVariantEntity ProductVariant { get; set; } = null!;
}
