using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Infrastructure.Data.Configurations;

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
        builder.HasKey(e => e.Imei);
    }
}

public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItemEntity>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.PurchaseOrder).WithMany(p => p.Items).HasForeignKey(e => e.PurchaseOrderId);
    }
}

public class WarehouseTransferItemConfiguration : IEntityTypeConfiguration<WarehouseTransferItemEntity>
{
    public void Configure(EntityTypeBuilder<WarehouseTransferItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Transfer).WithMany(t => t.Items).HasForeignKey(e => e.TransferId);
    }
}

public class StockTakeItemConfiguration : IEntityTypeConfiguration<StockTakeItemEntity>
{
    public void Configure(EntityTypeBuilder<StockTakeItemEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.StockTake).WithMany(s => s.Items).HasForeignKey(e => e.StockTakeId);
    }
}
