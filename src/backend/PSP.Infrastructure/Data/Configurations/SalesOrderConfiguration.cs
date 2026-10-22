using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng SalesOrders (Đơn bán hàng).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này định cấu hình các trường dữ liệu và ràng buộc cho bảng SalesOrders.
/// - Thiết lập mối quan hệ giữa Đơn hàng với Khách hàng, Nhân viên, Chi nhánh và Voucher.
/// - Chuyển đổi Enum SalesOrderStatus sang chuỗi để dễ đọc trực tiếp trong SQL.
/// </summary>
public class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrderEntity>
{
    public void Configure(EntityTypeBuilder<SalesOrderEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("SalesOrders");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Cột Code (Mã đơn hàng) - Bắt buộc, dài tối đa 50 ký tự, độc nhất
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Trạng thái đơn hàng (Pending, Confirmed, Completed, Cancelled)
        // Chuyển Enum sang chuỗi String để lưu CSDL dễ đọc
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 5. Cấu hình các cột giá trị tài chính (Decimal 18,2)
        builder.Property(e => e.Subtotal)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.Discount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.Total)
            .IsRequired()
            .HasPrecision(18, 2);

        // 6. Cấu hình mối quan hệ khóa ngoại (Foreign Keys):
        
        // Đơn hàng thuộc về một Khách hàng (Customer)
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Đơn hàng được tạo bởi một Nhân viên (User)
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Đơn hàng phát sinh tại một Chi nhánh (Branch)
        builder.HasOne(e => e.Branch)
            .WithMany()
            .HasForeignKey(e => e.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Đơn hàng có thể có hoặc không áp dụng Voucher (VoucherId nullable)
        builder.HasOne(e => e.Voucher)
            .WithMany()
            .HasForeignKey(e => e.VoucherId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // Đơn hàng có thể liên kết với một Hóa đơn tài chính (InvoiceId nullable)
        builder.HasOne(e => e.Invoice)
            .WithMany()
            .HasForeignKey("InvoiceId")
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // 7. Quan hệ 1-Nhiều với bảng SalesOrderItems (Chi tiết đơn hàng)
        // Khi xóa đơn hàng vật lý (hoặc xóa cascade), các dòng chi tiết đơn hàng cũng tự động xóa theo (Cascade).
        builder.HasMany(e => e.Items)
            .WithOne(e => e.SalesOrder)
            .HasForeignKey(e => e.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
