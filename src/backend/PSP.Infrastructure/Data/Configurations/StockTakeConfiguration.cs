using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho bảng StockTakes (Phiếu kiểm kê kho).
/// </summary>
public class StockTakeConfiguration : IEntityTypeConfiguration<StockTakeEntity>
{
    public void Configure(EntityTypeBuilder<StockTakeEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.HasOne(e => e.Warehouse)
            .WithMany()
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
