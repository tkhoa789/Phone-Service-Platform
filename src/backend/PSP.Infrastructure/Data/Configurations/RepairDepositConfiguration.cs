using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình cơ sở dữ liệu (Fluent API) cho bảng RepairDeposits (Phiếu thu cọc sửa chữa).
/// </summary>
public class RepairDepositConfiguration : IEntityTypeConfiguration<RepairDepositEntity>
{
    public void Configure(EntityTypeBuilder<RepairDepositEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("RepairDeposits");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Số tiền cọc
        builder.Property(e => e.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        // 4. Trạng thái (Lưu dạng chuỗi)
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 5. Mã giao dịch
        builder.Property(e => e.TransactionCode)
            .HasMaxLength(100);

        // 6. Tối ưu Concurrency & Idempotency
        builder.Property(e => e.IdempotencyKey)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(e => e.IdempotencyKey)
            .IsUnique();

        builder.Property(e => e.RequestPayloadHash)
            .HasMaxLength(256);

        builder.Property(e => e.RowVersion)
            .IsRowVersion();

        // 7. Cấu hình FK
        builder.HasOne(e => e.RepairTicket)
            .WithMany(rt => rt.Deposits)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReceivedBy)
            .WithMany()
            .HasForeignKey(e => e.ReceivedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
