using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng RepairParts (Linh kiện thay thế sửa chữa).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cấu hình bảng trung gian/bảng con lưu danh sách các linh kiện thay thế cho mỗi phiếu sửa chữa.
/// - Đảm bảo ràng buộc đơn giá linh kiện được định dạng đúng số thực thập phân.
/// - Thiết lập quan hệ liên kết đến Phiếu sửa chữa cha và Biến thể sản phẩm (linh kiện trong kho).
/// </summary>
public class RepairPartConfiguration : IEntityTypeConfiguration<RepairPartEntity>
{
    public void Configure(EntityTypeBuilder<RepairPartEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("RepairParts");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Số lượng linh kiện sử dụng - Bắt buộc
        builder.Property(e => e.Quantity)
            .IsRequired();

        // 4. Đơn giá linh kiện tại thời điểm thay thế (UnitPrice) - Decimal 18,2
        builder.Property(e => e.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);

        // 5. Cấu hình mối quan hệ khóa ngoại (Foreign Keys)
        
        // Chi tiết linh kiện thuộc về một Phiếu sửa chữa cha
        builder.HasOne(e => e.RepairTicket)
            .WithMany(t => t.Parts)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Restrict);

        // Chi tiết linh kiện trỏ đến một Biến thể sản phẩm (linh kiện thực tế lấy từ kho)
        builder.HasOne(e => e.ProductVariant)
            .WithMany()
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
