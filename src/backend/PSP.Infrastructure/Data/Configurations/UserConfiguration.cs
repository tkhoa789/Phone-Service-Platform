using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho bảng Users (Người dùng / Nhân viên hệ thống).
/// Thiết lập độ dài trường tối ưu hóa trang đệm và Filtered Unique Indexes bảo vệ toàn vẹn tài khoản.
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Username)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.Username)
            .IsUnique()
            .HasFilter("[Username] IS NOT NULL AND [Username] <> ''");

        builder.Property(e => e.Email)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(e => e.Email)
            .IsUnique()
            .HasFilter("[Email] IS NOT NULL AND [Email] <> ''");

        builder.Property(e => e.FullName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Phone)
            .HasMaxLength(20);

        builder.Property(e => e.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasColumnType("int")
            .IsRequired();

        builder.HasOne(e => e.Branch)
            .WithMany(b => b.Users)
            .HasForeignKey(e => e.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
