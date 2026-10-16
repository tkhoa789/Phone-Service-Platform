using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng RepairStatusHistories (Lịch sử trạng thái phiếu sửa chữa).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này giúp lưu trữ lịch sử chuyển đổi trạng thái của phiếu sửa chữa để theo dõi tiến độ sửa của thiết bị.
/// - Lưu trữ thông tin trạng thái dạng chuỗi và ghi chú lý do chuyển trạng thái.
/// </summary>
public class RepairStatusHistoryConfiguration : IEntityTypeConfiguration<RepairStatusHistoryEntity>
{
    public void Configure(EntityTypeBuilder<RepairStatusHistoryEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("RepairStatusHistories");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Trạng thái chuyển đổi - Bắt buộc, tối đa 20 ký tự
        builder.Property(e => e.Status)
            .IsRequired()
            .HasMaxLength(20);

        // 4. Ghi chú lý do chuyển trạng thái hoặc kết quả kiểm tra
        builder.Property(e => e.Note)
            .HasMaxLength(500);

        // Section 15: Audit fields
        builder.Property(e => e.Action)
            .HasMaxLength(100);

        builder.Property(e => e.ActorName)
            .HasMaxLength(100);

        builder.Property(e => e.Details)
            .HasMaxLength(1000);

        // 5. Thời điểm ghi nhận lịch sử
        builder.Property(e => e.CreatedAt)
            .IsRequired();

        // 6. Cấu hình mối quan hệ khóa ngoại (Foreign Keys)
        
        // Bản ghi lịch sử thuộc về một Phiếu sửa chữa cha
        builder.HasOne(e => e.RepairTicket)
            .WithMany(t => t.StatusHistories)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
