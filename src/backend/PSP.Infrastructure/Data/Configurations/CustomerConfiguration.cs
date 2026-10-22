using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Customer.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho bảng Customers (Khách hàng).
/// </summary>
public class CustomerConfiguration : IEntityTypeConfiguration<CustomerEntity>
{
    public void Configure(EntityTypeBuilder<CustomerEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.Property(e => e.FullName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Phone)
            .HasMaxLength(15)
            .IsRequired();

        builder.HasIndex(e => e.Phone)
            .IsUnique();

        builder.Property(e => e.Email)
            .HasMaxLength(100);

        builder.Property(e => e.Address)
            .HasMaxLength(255);

        builder.Property(e => e.RewardPoints)
            .HasDefaultValue(0);

        builder.Property(e => e.TotalSpent)
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(0m);

        builder.Property(e => e.MemberTier)
            .HasMaxLength(20)
            .HasDefaultValue("BRONZE");

        builder.Property(e => e.RowVersion)
            .IsRowVersion();
    }
}
