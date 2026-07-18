using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng InvoiceItems (Chi tiết hóa đơn).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Thiết lập cấu trúc cột của các mặt hàng chi tiết thuộc một hóa đơn.
/// </summary>
public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItemEntity>
{
    public void Configure(EntityTypeBuilder<InvoiceItemEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("InvoiceItems");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Số lượng
        builder.Property(e => e.Quantity)
            .IsRequired();

        // 4. Đơn giá thực tế chốt trên hóa đơn
        builder.Property(e => e.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);

        // 5. Cấu hình mối quan hệ khóa ngoại (Foreign Keys):
        builder.HasOne(e => e.ProductVariant)
            .WithMany()
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
