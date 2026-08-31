using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng RepairTickets (Phiếu sửa chữa).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này giúp EF Core hiểu cách cấu hình tên bảng, kiểu dữ liệu các cột và các ràng buộc khóa chính/khóa ngoại.
/// - Chuyển đổi enum RepairTicketStatus sang dạng chuỗi (string) trong cơ sở dữ liệu để dễ dàng kiểm tra và đọc dữ liệu thô.
/// - Thiết lập các mối quan hệ chặt chẽ với Khách hàng, Biến thể sản phẩm (thiết bị sửa), Nhân viên tiếp nhận, Kỹ thuật viên.
/// </summary>
public class RepairTicketConfiguration : IEntityTypeConfiguration<RepairTicketEntity>
{
    public void Configure(EntityTypeBuilder<RepairTicketEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("RepairTickets");

        // 2. Khóa chính (Id đã kế thừa từ BaseEntity)
        builder.HasKey(e => e.Id);

        // 3. Mã phiếu sửa chữa (Code) - Bắt buộc, dài tối đa 50 ký tự, độc nhất
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 4. Trạng thái phiếu sửa chữa (Enum) - Lưu dạng string để dễ theo dõi
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 5. Mô tả lỗi từ khách hàng (ProblemDescription) - Bắt buộc
        builder.Property(e => e.ProblemDescription)
            .IsRequired()
            .HasMaxLength(1000);

        // 6. Số IMEI của thiết bị sửa chữa (Imei) - Có thể null (nếu máy không có imei hoặc khách không nhớ)
        builder.Property(e => e.Imei)
            .HasMaxLength(18);

        // 7. Định mức chi phí ước tính và thực tế
        builder.Property(e => e.EstimatedCost)
            .HasPrecision(18, 2);

        builder.Property(e => e.ActualCost)
            .HasPrecision(18, 2);

        builder.Property(e => e.LaborCost)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.RowVersion)
            .IsRowVersion();

        // 8. Cấu hình mối quan hệ khóa ngoại (Foreign Keys)
        // Chặn Cascade Delete (sử dụng Restrict) để khi xóa khách hàng hay sản phẩm không bị xóa nhầm lịch sử sửa chữa.
        
        // Phiếu sửa chữa phải thuộc về một Chi nhánh (BranchId không được null)
        builder.HasOne(e => e.Branch)
            .WithMany()
            .HasForeignKey(e => e.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Phiếu sửa chữa thuộc về một Khách hàng
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Phiếu sửa chữa liên kết tới một Dòng biến thể sản phẩm (thiết bị được sửa)
        builder.HasOne(e => e.ProductVariant)
            .WithMany()
            .HasForeignKey(e => e.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Phiếu sửa chữa được tiếp nhận bởi một Nhân viên (ReceivedBy)
        builder.HasOne(e => e.ReceivedBy)
            .WithMany()
            .HasForeignKey(e => e.ReceivedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Phiếu sửa chữa có thể được phân công cho một Kỹ thuật viên (Technician)
        builder.HasOne(e => e.Technician)
            .WithMany()
            .HasForeignKey(e => e.TechnicianId)
            .OnDelete(DeleteBehavior.Restrict);

        // Một phiếu sửa chữa có thể có nhiều linh kiện thay thế (Parts)
        builder.HasMany(e => e.Parts)
            .WithOne(e => e.RepairTicket)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Cascade); // Khi xóa phiếu sửa chữa nháp, tự động xóa linh kiện đi kèm

        // Một phiếu sửa chữa có nhiều lịch sử trạng thái sửa chữa (StatusHistories)
        builder.HasMany(e => e.StatusHistories)
            .WithOne(e => e.RepairTicket)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Cascade); // Khi xóa phiếu sửa chữa nháp, tự động xóa lịch sử trạng thái
    }
}
