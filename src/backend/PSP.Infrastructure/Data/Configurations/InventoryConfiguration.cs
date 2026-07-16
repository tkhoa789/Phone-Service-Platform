using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho thực thể WarehouseEntity (Kho hàng).
/// Định nghĩa các ràng buộc khoá chính, kiểu dữ liệu, index độc nhất và mối quan hệ với chi nhánh.
/// </summary>
public class WarehouseConfiguration : IEntityTypeConfiguration<WarehouseEntity>
{
    public void Configure(EntityTypeBuilder<WarehouseEntity> builder)
    {
        // 1. Chỉ định khóa chính cho bảng Warehouses
        builder.HasKey(e => e.Id);

        // 2. Cấu hình thuộc tính Code (Mã kho)
        // - Kiểu dữ liệu VARCHAR(30) trên Database
        // - Bắt buộc nhập (IsRequired)
        builder.Property(e => e.Code)
            .HasMaxLength(30)
            .IsRequired();

        // 3. Cấu hình thuộc tính Name (Tên kho)
        // - Kiểu dữ liệu VARCHAR(100) trên Database
        // - Bắt buộc nhập (IsRequired)
        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .IsRequired();

        // 4. Thiết lập Unique Index cho Code
        // - Chặn việc tạo 2 kho hàng có trùng mã Code
        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 5. Cấu hình mối quan hệ 1-N giữa Warehouse và Branch
        // - Một kho hàng (Warehouse) thuộc về một chi nhánh (Branch)
        // - Một chi nhánh có thể quản lý nhiều kho hàng (b.Warehouses)
        // - Sử dụng khóa ngoại BranchId
        // - Khi xóa Chi nhánh, chặn xóa (DeleteBehavior.Restrict) nếu kho hàng vẫn tồn tại để bảo vệ dữ liệu.
        builder.HasOne(e => e.Branch)
            .WithMany(b => b.Warehouses)
            .HasForeignKey(e => e.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>
/// Cấu hình cho bảng Inventories (Tồn kho).
/// </summary>
public class InventoryConfiguration : IEntityTypeConfiguration<InventoryEntity>
{
    public void Configure(EntityTypeBuilder<InventoryEntity> builder)
    {
        builder.HasKey(e => e.Id);
    }
}

public class ImeiConfiguration : IEntityTypeConfiguration<ImeiEntity>
{
    public void Configure(EntityTypeBuilder<ImeiEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Imei)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.Imei)
            .IsUnique();

        builder.HasOne(e => e.ProductVariant)
            .WithMany(v => v.Imeis)
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Warehouse)
            .WithMany(w => w.Imeis)
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>
/// Cấu hình cho bảng PurchaseOrderItems (Chi tiết phiếu nhập).
/// </summary>
public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItemEntity>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.PurchaseOrder).WithMany(p => p.Items).HasForeignKey(e => e.PurchaseOrderId);
    }
}

/// <summary>
/// Cấu hình cho bảng WarehouseTransferItems (Chi tiết chuyển kho).
/// </summary>
public class WarehouseTransferItemConfiguration : IEntityTypeConfiguration<WarehouseTransferItemEntity>
{
    public void Configure(EntityTypeBuilder<WarehouseTransferItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Transfer).WithMany(t => t.Items).HasForeignKey(e => e.TransferId);
    }
}

/// <summary>
/// Cấu hình cho bảng StockTakeItems (Chi tiết kiểm kho).
/// </summary>
public class StockTakeItemConfiguration : IEntityTypeConfiguration<StockTakeItemEntity>
{
    public void Configure(EntityTypeBuilder<StockTakeItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.StockTake).WithMany(s => s.Items).HasForeignKey(e => e.StockTakeId);
    }
}

/// <summary>
/// Cấu hình cho bảng PurchaseOrders (Phiếu nhập kho).
/// </summary>
public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrderEntity>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.HasOne(e => e.Supplier)
            .WithMany()
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Warehouse)
            .WithMany()
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}



