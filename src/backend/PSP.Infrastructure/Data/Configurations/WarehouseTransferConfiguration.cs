using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Infrastructure.Data.Configurations;

public class WarehouseTransferConfiguration : IEntityTypeConfiguration<WarehouseTransferEntity>
{
    public void Configure(EntityTypeBuilder<WarehouseTransferEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.HasOne(e => e.FromWarehouse)
            .WithMany()
            .HasForeignKey(e => e.FromWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ToWarehouse)
            .WithMany()
            .HasForeignKey(e => e.ToWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
