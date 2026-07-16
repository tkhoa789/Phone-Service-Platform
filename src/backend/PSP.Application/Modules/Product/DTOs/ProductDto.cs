namespace PSP.Application.Modules.Product.DTOs;

/// <summary>
/// DATA TRANSFER OBJECT (Đối tượng trung chuyển dữ liệu).
/// DTO này dùng để đóng gói và gửi thông tin chi tiết của Dòng sản phẩm (bao gồm cả danh mục biến thể) ra ngoài API.
/// </summary>
public class ProductDto
{
    /// <summary>
    /// Mã định danh duy nhất (Guid) của dòng sản phẩm trong Database.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Id của danh mục mà dòng sản phẩm này trực thuộc.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Tên của danh mục (Ví dụ: "Điện thoại"). Được điền thủ công lúc truy vấn.
    /// </summary>
    public string CategoryName { get; set; } = string.Empty;

    /// <summary>
    /// Id của thương hiệu.
    /// </summary>
    public Guid BrandId { get; set; }

    /// <summary>
    /// Tên của hãng thương hiệu (Ví dụ: "Apple"). Được điền thủ công lúc truy vấn.
    /// </summary>
    public string BrandName { get; set; } = string.Empty;

    /// <summary>
    /// Mã viết tắt của dòng máy (Ví dụ: "IPHONE_16_PM").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Tên dòng sản phẩm (Ví dụ: "iPhone 16 Pro Max").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết hoặc thông số kỹ thuật.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Danh sách tất cả các biến thể (màu sắc, cấu hình dung lượng, giá bán) thuộc dòng máy này.
    /// </summary>
    public IEnumerable<ProductVariantDto> Variants { get; set; } = new List<ProductVariantDto>();

    /// <summary>
    /// Ngày tạo bản ghi.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Người tạo.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Ngày sửa gần nhất.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Người sửa gần nhất.
    /// </summary>
    public string? UpdatedBy { get; set; }
}
