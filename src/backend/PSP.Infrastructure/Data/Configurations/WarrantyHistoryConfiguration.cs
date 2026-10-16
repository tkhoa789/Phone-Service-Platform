using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Warranty.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng WarrantyHistories (Lịch sử bảo hành).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này cấu hình bảng phụ lưu lại lịch sử xử lý, chuyển trung tâm hãng, đổi máy, v.v.
/// </summary>
public class WarrantyHistoryConfiguration : IEntityTypeConfiguration<WarrantyHistoryEntity>
{
    public void Configure(EntityTypeBuilder<WarrantyHistoryEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("WarrantyHistories");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Thao tác xử lý (Action) - Bắt buộc, dài tối đa 100 ký tự
        builder.Property(e => e.Action)
            .IsRequired()
            .HasMaxLength(100);

        // 4. Trạng thái cập nhật (Status) - Bắt buộc, dài tối đa 20 ký tự
        builder.Property(e => e.Status)
            .IsRequired()
            .HasMaxLength(20);

        // 5. Mô tả chi tiết tiến độ (Description) - Tối đa 500 ký tự
        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.ActorName)
            .HasMaxLength(100);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // 6. Cấu hình mối quan hệ khóa ngoại (Foreign Keys)
        
        // Bản ghi lịch sử thuộc về một Phiếu bảo hành cha
        builder.HasOne(e => e.WarrantyTicket)
            .WithMany(t => t.Histories)
            .HasForeignKey(e => e.WarrantyTicketId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
