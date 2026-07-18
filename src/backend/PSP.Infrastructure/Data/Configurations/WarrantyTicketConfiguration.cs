using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Warranty.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng WarrantyTickets (Phiếu bảo hành).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cấu hình bảng lưu thông tin các phiếu bảo hành thiết bị.
/// - Ánh xạ các thuộc tính Code, Status (chuyển đổi enum sang string), Imei, StartDate, EndDate.
/// - Thiết lập mối quan hệ với Khách hàng, Đơn hàng gốc và Dòng sản phẩm.
/// </summary>
public class WarrantyTicketConfiguration : IEntityTypeConfiguration<WarrantyTicketEntity>
{
    public void Configure(EntityTypeBuilder<WarrantyTicketEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("WarrantyTickets");

        // 2. Khóa chính (Id đã kế thừa từ BaseEntity)
        builder.HasKey(e => e.Id);

        // 3. Mã phiếu bảo hành (Code) - Bắt buộc, dài tối đa 50 ký tự, độc nhất
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Trạng thái phiếu bảo hành (Enum) - Lưu dạng string
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 5. Số IMEI của thiết bị bảo hành (Imei) - Tối đa 18 ký tự
        builder.Property(e => e.Imei)
            .HasMaxLength(18);

        // 6. Ghi chú giải trình bảo hành (Note) - Tối đa 1000 ký tự
        builder.Property(e => e.Note)
            .HasMaxLength(1000);

        // 7. Cấu hình mối quan hệ khóa ngoại (Foreign Keys)
        
        // Phiếu bảo hành thuộc về một Khách hàng
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Phiếu bảo hành có thể liên kết đến một Đơn hàng gốc (SalesOrder) - Có thể null nếu bảo hành ngoài
        builder.HasOne(e => e.SalesOrder)
            .WithMany()
            .HasForeignKey(e => e.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Phiếu bảo hành liên kết đến một Biến thể sản phẩm (Thiết bị được bảo hành)
        builder.HasOne(e => e.ProductVariant)
            .WithMany()
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Một phiếu bảo hành có nhiều lượt ghi nhận lịch sử xử lý (Histories)
        builder.HasMany(e => e.Histories)
            .WithOne(e => e.WarrantyTicket)
            .HasForeignKey(e => e.WarrantyTicketId)
            .OnDelete(DeleteBehavior.Cascade); // Khi xóa phiếu bảo hành, tự động xóa lịch sử đi kèm
    }
}
