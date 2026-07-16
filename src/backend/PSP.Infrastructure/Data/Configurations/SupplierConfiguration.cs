using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// CONFIGURATION (Cấu hình ánh xạ Cơ sở dữ liệu cho thực thể Nhà cung cấp).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này triển khai interface "IEntityTypeConfiguration<SupplierEntity>" của EF Core.
/// - Nó cho phép ta định nghĩa chi tiết cấu trúc của bảng trong SQL Server mà không cần viết các thuộc tính trực tiếp lên Entity (giúp tách biệt database ra khỏi Domain).
/// - Ta sử dụng các cú pháp Fluent API (như ToTable, HasKey, Property, HasIndex...) để định cấu hình.
/// </summary>
public class SupplierConfiguration : IEntityTypeConfiguration<SupplierEntity>
{
    /// <summary>
    /// Phương thức Configure chứa cấu hình chi tiết cho bảng Suppliers.
    /// </summary>
    public void Configure(EntityTypeBuilder<SupplierEntity> builder)
    {
        // 1. Chỉ định tên bảng trong cơ sở dữ liệu SQL Server là "Suppliers"
        builder.ToTable("Suppliers");

        // 2. Chỉ định thuộc tính "Id" làm Khóa chính (Primary Key - PK) cho bảng
        builder.HasKey(e => e.Id);

        // 3. Cấu hình cho cột "Code" (Mã nhà cung cấp)
        builder.Property(e => e.Code)
            .IsRequired()                 // Cột này bắt buộc phải có giá trị (NOT NULL trong SQL)
            .HasMaxLength(30);            // Chiều dài chuỗi tối đa là 30 ký tự (nvarchar(30))

        // 4. Cấu hình cho cột "Name" (Tên nhà cung cấp)
        builder.Property(e => e.Name)
            .IsRequired()                 // Bắt buộc (NOT NULL)
            .HasMaxLength(150);           // Chiều dài tối đa 150 ký tự (nvarchar(150))

        // 5. Cấu hình cho cột "Phone" (Số điện thoại)
        builder.Property(e => e.Phone)
            .IsRequired(false)            // Cho phép null (NULL trong SQL)
            .HasMaxLength(15);            // Chiều dài tối đa 15 ký tự (nvarchar(15))

        // 6. Cấu hình cho cột "Email"
        builder.Property(e => e.Email)
            .IsRequired(false)            // Cho phép null
            .HasMaxLength(100);           // Chiều dài tối đa 100 ký tự (nvarchar(100))

        // 7. Cấu hình cho cột "Address" (Địa chỉ)
        builder.Property(e => e.Address)
            .IsRequired(false)            // Cho phép null
            .HasMaxLength(255);           // Chiều dài tối đa 255 ký tự (nvarchar(255))

        // 8. [RÀNG BUỘC ĐỘC NHẤT]: Tạo một Unique Index trên cột "Code".
        // Đảm bảo ở mức cơ sở dữ liệu không bao giờ xảy ra tình trạng có hai nhà cung cấp có cùng mã Code.
        builder.HasIndex(e => e.Code)
            .IsUnique();
    }
}

