using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng Vouchers (Mã giảm giá).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này định nghĩa cấu trúc của bảng "Vouchers" trong SQL Server ánh xạ từ "VoucherEntity".
/// - Cấu hình chuyển đổi kiểu dữ liệu Enum sang chuỗi String để lưu trong database dễ đọc.
/// - Thiết lập ràng buộc khóa ngoại chỉ tới bảng Promotions.
/// </summary>
public class VoucherConfiguration : IEntityTypeConfiguration<VoucherEntity>
{
    public void Configure(EntityTypeBuilder<VoucherEntity> builder)
    {
        // 1. Định nghĩa tên bảng
        builder.ToTable("Vouchers");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Khóa ngoại liên kết tới Promotions (được cấu hình ở đây hoặc bên PromotionConfiguration)
        builder.Property(e => e.PromotionId)
            .IsRequired();

        // 4. Mã Voucher (e.g. VIP100K, SALE2026)
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(30);

        // Đảm bảo không bao giờ có hai Voucher trùng mã Code trong toàn bộ hệ thống
        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 5. Cấu hình cột Status (Trạng thái của Voucher)
        // Chuyển đổi kiểu Enum (Active, Used, Expired...) sang dạng chuỗi VARCHAR(20) trong database để dễ đọc dữ liệu trực tiếp bằng SQL
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 6. Số tiền được chiết khấu trực tiếp
        builder.Property(e => e.DiscountAmount)
            .IsRequired()
            .HasPrecision(18, 2);

        // 7. Giá trị đơn hàng tối thiểu để áp dụng Voucher
        builder.Property(e => e.MinOrderValue)
            .IsRequired()
            .HasPrecision(18, 2);

        // 8. Hạn chót sử dụng Voucher
        builder.Property(e => e.ExpiryDate)
            .IsRequired();

        // 9. Giới hạn số lần sử dụng và số lần đã dùng thực tế
        builder.Property(e => e.UsageLimit)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(e => e.UsageCount)
            .IsRequired()
            .HasDefaultValue(0);
    }
}
