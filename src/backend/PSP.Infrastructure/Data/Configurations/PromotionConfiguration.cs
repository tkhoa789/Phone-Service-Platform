using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng Promotions (Chương trình khuyến mãi).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này giúp EF Core hiểu cách ánh xạ lớp "PromotionEntity" thành bảng "Promotions" trong SQL Server.
/// - Chúng ta định nghĩa kiểu dữ liệu nvarchar, độ dài tối đa, trường bắt buộc (NOT NULL), và các ràng buộc như chỉ mục duy nhất (Unique Index).
/// </summary>
public class PromotionConfiguration : IEntityTypeConfiguration<PromotionEntity>
{
    public void Configure(EntityTypeBuilder<PromotionEntity> builder)
    {
        // 1. Định nghĩa tên bảng
        builder.ToTable("Promotions");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Cấu hình cột Code (Mã chương trình)
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(30);

        // Đảm bảo mã khuyến mãi là độc nhất vô nhị trên toàn hệ thống
        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Cấu hình cột Name (Tên chương trình)
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(150);

        // 5. Cấu hình cột Type (Loại giảm giá: PERCENTAGE hoặc DIRECT_VALUE)
        builder.Property(e => e.Type)
            .IsRequired()
            .HasMaxLength(20);

        // 6. Cấu hình cột Value (Giá trị giảm giá)
        builder.Property(e => e.Value)
            .IsRequired()
            .HasPrecision(18, 2);

        // 7. Thời gian bắt đầu và kết thúc
        builder.Property(e => e.StartDate)
            .IsRequired();

        builder.Property(e => e.EndDate)
            .IsRequired();

        // 8. Trạng thái kích hoạt hoạt động
        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // 9. Cấu hình quan hệ 1-Nhiều với bảng Vouchers:
        // Một chương trình khuyến mãi (Promotion) có thể sinh ra nhiều mã Voucher giảm giá khác nhau.
        // Khi xóa một Promotion, chúng ta chặn không cho phép xóa (Restrict) nếu đang có Voucher liên kết với nó.
        builder.HasMany(e => e.Vouchers)
            .WithOne(e => e.Promotion)
            .HasForeignKey(e => e.PromotionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
