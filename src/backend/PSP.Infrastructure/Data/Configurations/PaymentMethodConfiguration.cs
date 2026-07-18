using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng PaymentMethods (Phương thức thanh toán).
/// </summary>
public class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethodEntity>
{
    public void Configure(EntityTypeBuilder<PaymentMethodEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("PaymentMethods");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Mã phương thức (ví dụ: CASH, BANK_TRANSFER, MOMO) - Bắt buộc, tối đa 30 ký tự, độc nhất
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Tên phương thức (Ví dụ: Tiền mặt, Chuyển khoản ngân hàng)
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        // 5. Cờ kích hoạt hoạt động
        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
