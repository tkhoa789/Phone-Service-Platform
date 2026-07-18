using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng SalesOrderItems (Chi tiết đơn hàng).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này định nghĩa các ràng buộc cột cho bảng chi tiết đơn hàng (ví dụ: IMEI của điện thoại, đơn giá, chiết khấu).
/// - Liên kết chi tiết với biến thể sản phẩm cụ thể.
/// </summary>
public class SalesOrderItemConfiguration : IEntityTypeConfiguration<SalesOrderItemEntity>
{
    public void Configure(EntityTypeBuilder<SalesOrderItemEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("SalesOrderItems");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Số IMEI (nếu có, đối với điện thoại). Lưu chuỗi tối đa 18 ký tự, có thể NULL nếu là phụ kiện không quản lý theo IMEI.
        builder.Property(e => e.Imei)
            .HasMaxLength(18)
            .IsRequired(false);

        // 4. Số lượng sản phẩm bán
        builder.Property(e => e.Quantity)
            .IsRequired();

        // 5. Đơn giá bán thực tế và số tiền chiết khấu riêng trên sản phẩm (Decimal 18,2)
        builder.Property(e => e.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.Discount)
            .IsRequired()
            .HasPrecision(18, 2);

        // 6. Cấu hình mối quan hệ khóa ngoại (Foreign Keys):
        
        // Chi tiết liên kết tới một biến thể sản phẩm (ProductVariant)
        builder.HasOne(e => e.ProductVariant)
            .WithMany()
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Lưu ý: Mối quan hệ giữa SalesOrderItems và SalesOrder đã được định cấu hình 
        // chiều ngược lại ở SalesOrderConfiguration (HasMany -> WithOne).
    }
}
