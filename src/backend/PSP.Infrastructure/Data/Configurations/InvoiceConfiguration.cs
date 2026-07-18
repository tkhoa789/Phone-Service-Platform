using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng Invoices (Hóa đơn).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cấu hình tên bảng, khóa chính và các thuộc tính liên quan đến Hóa đơn.
/// - Chuyển đổi trạng thái InvoiceStatus sang dạng chuỗi trong CSDL.
/// - Thiết lập mối quan hệ 1-1 hoặc 1-Nhiều từ Đơn hàng bán lẻ tới Hóa đơn.
/// </summary>
public class InvoiceConfiguration : IEntityTypeConfiguration<InvoiceEntity>
{
    public void Configure(EntityTypeBuilder<InvoiceEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("Invoices");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Mã hóa đơn (Ví dụ: INV-20260717-123456) - Bắt buộc, dài tối đa 50 ký tự, độc nhất
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Trạng thái hóa đơn (Draft, Issued, Paid, Cancelled)
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 5. Tổng tiền hóa đơn (Decimal 18,2)
        builder.Property(e => e.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        // 6. Cấu hình mối quan hệ khóa ngoại (Foreign Keys):
        
        // Một hóa đơn thuộc về duy nhất một Đơn hàng bán lẻ (SalesOrder)
        // Thiết lập OnDelete Restrict để tránh việc xóa đơn hàng làm ảnh hưởng dây chuyền đến sổ sách hóa đơn
        builder.HasOne(e => e.SalesOrder)
            .WithMany()
            .HasForeignKey(e => e.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Một hóa đơn có thể chứa nhiều chi tiết hóa đơn (InvoiceItems)
        builder.HasMany(e => e.Items)
            .WithOne(e => e.Invoice)
            .HasForeignKey(e => e.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Một hóa đơn có thể có nhiều lượt thanh toán thực tế (Payments)
        builder.HasMany(e => e.Payments)
            .WithOne(e => e.Invoice)
            .HasForeignKey(e => e.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
