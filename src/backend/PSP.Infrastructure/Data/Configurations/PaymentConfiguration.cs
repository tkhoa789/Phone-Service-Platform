using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng Payments (Giao dịch thanh toán thực tế).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cấu hình bảng thanh toán, nơi ghi nhận dòng tiền vào của khách hàng.
/// - Liên kết giao dịch với hóa đơn mẹ (Invoice) và phương thức thanh toán.
/// </summary>
public class PaymentConfiguration : IEntityTypeConfiguration<PaymentEntity>
{
    public void Configure(EntityTypeBuilder<PaymentEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("Payments");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Mã giao dịch thanh toán (ví dụ mã tham chiếu ngân hàng hoặc mã tự sinh)
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Số tiền thanh toán (Decimal 18,2)
        builder.Property(e => e.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        // 5. Trạng thái thanh toán (Pending, Completed, Failed, Refunded)
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 6. Thời điểm thanh toán
        builder.Property(e => e.PaymentDate)
            .IsRequired();

        // 7. Cấu hình các mối quan hệ khóa ngoại (Foreign Keys):
        
        // Giao dịch thanh toán thuộc về một phương thức thanh toán cụ thể
        builder.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
