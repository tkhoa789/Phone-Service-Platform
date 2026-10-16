using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Infrastructure.Data.Configurations;

public class SupplierDebtTransactionConfiguration : IEntityTypeConfiguration<SupplierDebtTransactionEntity>
{
    public void Configure(EntityTypeBuilder<SupplierDebtTransactionEntity> builder)
    {
        builder.ToTable("SupplierDebtTransactions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TransactionType)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(e => e.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Property(e => e.BalanceAfter)
            .HasColumnType("decimal(18,2)");

        builder.Property(e => e.ReferenceNo)
            .HasMaxLength(50);

        builder.Property(e => e.PaymentMethod)
            .HasMaxLength(30);

        builder.Property(e => e.Note)
            .HasMaxLength(500);

        builder.HasOne(e => e.Supplier)
            .WithMany(s => s.DebtTransactions)
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
