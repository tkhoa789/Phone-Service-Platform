using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Infrastructure.Data.Configurations;

/// <summary>
/// Cấu hình Entity Framework Core cho thực thể Thương hiệu (BrandEntity)
/// Kế thừa IEntityTypeConfiguration để tách biệt cấu hình bảng (Fluent API) ra khỏi AppDbContext, giúp file DbContext ngắn gọn.
/// </summary>
public class BrandConfiguration : IEntityTypeConfiguration<BrandEntity>
{
    /// <summary>
    /// Định nghĩa cấu trúc bảng và các ràng buộc dữ liệu.
    /// </summary>
    public void Configure(EntityTypeBuilder<BrandEntity> builder)
    {
        // 1. Chỉ định tên bảng trong Cơ sở dữ liệu là "Brands"
        builder.ToTable("Brands");
        
        // 2. Định nghĩa Khóa chính (Primary Key) là cột Id
        builder.HasKey(e => e.Id);
        
        // 3. Cấu hình cột Code (Mã thương hiệu)
        builder.Property(e => e.Code)
            .IsRequired()                 // Bắt buộc nhập (NOT NULL trong SQL)
            .HasMaxLength(30);            // Chiều dài tối đa 30 ký tự (nvarchar(30))
            
        // 4. Cấu hình cột Name (Tên thương hiệu)
        builder.Property(e => e.Name)
            .IsRequired()                 // Bắt buộc nhập (NOT NULL)
            .HasMaxLength(100);           // Chiều dài tối đa 100 ký tự (nvarchar(100))
            
        // 5. Tạo Index độc nhất (Unique Index) trên cột Code để đảm bảo ở mức Database không thể có 2 thương hiệu trùng mã
        builder.HasIndex(e => e.Code)
            .IsUnique();
    }
}

/// <summary>
/// Cấu hình Entity Framework Core cho thực thể Danh mục sản phẩm (CategoryEntity)
/// </summary>
public class CategoryConfiguration : IEntityTypeConfiguration<CategoryEntity>
{
    /// <summary>
    /// Định nghĩa cấu trúc bảng và các ràng buộc dữ liệu cho danh mục, bao gồm mối quan hệ cha-con tự tham chiếu.
    /// </summary>
    public void Configure(EntityTypeBuilder<CategoryEntity> builder)
    {
        // 1. Tên bảng là "Categories"
        builder.ToTable("Categories");
        
        // 2. Khóa chính là cột Id
        builder.HasKey(e => e.Id);
        
        // 3. Cấu hình cột Code (Mã danh mục)
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(30);
            
        // 4. Cấu hình cột Name (Tên danh mục)
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        // 5. Đảm bảo mã danh mục (Code) là độc nhất
        builder.HasIndex(e => e.Code)
            .IsUnique();
            
        // 6. Cấu hình quan hệ tự tham chiếu (Self-Referencing Relationship) để làm cây danh mục cha - con:
        // - Một danh mục có thể có MỘT danh mục cha (HasOne Parent)
        // - Một danh mục cha có thể chứa NHIỀU danh mục con (WithMany Children)
        // - Khóa ngoại liên kết là cột ParentId (HasForeignKey ParentId)
        // - OnDelete(DeleteBehavior.Restrict) đảm bảo không cho phép xóa danh mục cha nếu vẫn còn danh mục con tham chiếu đến (Tránh xóa lan truyền)
        builder.HasOne(e => e.Parent)
            .WithMany(e => e.Children)
            .HasForeignKey(e => e.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>
/// CONFIGURATION (Cấu hình ánh xạ Cơ sở dữ liệu cho thực thể Dòng sản phẩm).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này quy định cách thức Entity Framework Core ánh xạ lớp C# "ProductEntity" thành bảng "Products" trong SQL Server.
/// - Đồng thời cấu hình các ràng buộc khóa ngoại (Foreign Keys) trỏ tới bảng Categories và Brands.
/// </summary>
public class ProductConfiguration : IEntityTypeConfiguration<ProductEntity>
{
    public void Configure(EntityTypeBuilder<ProductEntity> builder)
    {
        // 1. Tên bảng trong SQL Server
        builder.ToTable("Products");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Mã dòng sản phẩm: nvarchar(50), NOT NULL
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        // 4. Tên dòng sản phẩm: nvarchar(150), NOT NULL
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(150);

        // 5. Mô tả: nvarchar(max), NULL (cho phép rỗng)
        builder.Property(e => e.Description)
            .IsRequired(false);

        // 6. Index độc nhất trên mã sản phẩm (chặn trùng mã)
        builder.HasIndex(e => e.Code)
            .IsUnique();

        // 7. Mối quan hệ: Một dòng sản phẩm (Product) thuộc về một nhóm (Category)
        // Nếu xóa Danh mục mà đang có Dòng sản phẩm liên kết thì hệ thống sẽ chặn lại (DeleteBehavior.Restrict).
        builder.HasOne(e => e.Category)
            .WithMany(e => e.Products)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // 8. Mối quan hệ: Một dòng sản phẩm thuộc về một hãng thương hiệu (Brand)
        // Chặn xóa Thương hiệu nếu đang có Dòng sản phẩm (DeleteBehavior.Restrict).
        builder.HasOne(e => e.Brand)
            .WithMany(e => e.Products)
            .HasForeignKey(e => e.BrandId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>
/// CONFIGURATION (Cấu hình ánh xạ Cơ sở dữ liệu cho thực thể Biến thể sản phẩm).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Ánh xạ lớp C# "ProductVariantEntity" thành bảng "ProductVariants".
/// - Định cấu hình độ dài, độ chính xác số thập phân (Precision) cho giá tiền và Index cho SKU.
/// </summary>
public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariantEntity>
{
    public void Configure(EntityTypeBuilder<ProductVariantEntity> builder)
    {
        // 1. Tên bảng trong SQL Server
        builder.ToTable("ProductVariants");

        // 2. Khóa chính
        builder.HasKey(e => e.Id);

        // 3. Mã SKU: nvarchar(50), NOT NULL
        builder.Property(e => e.Sku)
            .IsRequired()
            .HasMaxLength(50);

        // 4. Tên biến thể sản phẩm đầy đủ: nvarchar(255), NOT NULL
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(255);

        // 5. Màu sắc: nvarchar(50), NULL
        builder.Property(e => e.Color)
            .IsRequired(false)
            .HasMaxLength(50);

        // 6. Dung lượng: nvarchar(30), NULL
        builder.Property(e => e.Capacity)
            .IsRequired(false)
            .HasMaxLength(30);

        // 7. Giá nhập kho gốc: decimal(18,2), NOT NULL
        builder.Property(e => e.CostPrice)
            .IsRequired()
            .HasPrecision(18, 2);

        // 8. Giá bán lẻ niêm yết: decimal(18,2), NOT NULL
        builder.Property(e => e.SalePrice)
            .IsRequired()
            .HasPrecision(18, 2);

        // 9. Index độc nhất trên mã SKU (chặn trùng mã SKU)
        builder.HasIndex(e => e.Sku)
            .IsUnique();

        // 10. Mối quan hệ: Một biến thể thuộc về một dòng sản phẩm cha (Product)
        // Chặn xóa dòng sản phẩm cha nếu vẫn còn các biến thể con tồn tại (DeleteBehavior.Restrict).
        builder.HasOne(e => e.Product)
            .WithMany(e => e.Variants)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}


