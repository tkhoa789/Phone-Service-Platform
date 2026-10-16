namespace PSP.Application.Modules.Product.DTOs;

/// <summary>
/// DATA TRANSFER OBJECT (Đối tượng trung chuyển dữ liệu).
/// DTO này dùng để đóng gói và gửi thông tin chi tiết của Biến thể sản phẩm ra ngoài API.
/// </summary>
public class ProductVariantDto
{
    /// <summary>
    /// Mã định danh duy nhất (Guid) của biến thể trong Database.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Id của dòng sản phẩm cha.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Tên dòng sản phẩm cha (Ví dụ: "iPhone 16 Pro Max"). 
    /// Được điền thủ công bằng cách map dữ liệu để UI dễ hiển thị.
    /// </summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>
    /// Mã Stock Keeping Unit (Ví dụ: "IP16PM-256-DESERT").
    /// </summary>
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// Tên đầy đủ của biến thể (Ví dụ: "iPhone 16 Pro Max 256GB Titan Sa Mạc").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Màu sắc của sản phẩm (Ví dụ: "Titan Sa Mạc").
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Dung lượng bộ nhớ (Ví dụ: "256GB").
    /// </summary>
    public string? Capacity { get; set; }

    /// <summary>
    /// Giá nhập kho gốc của sản phẩm.
    /// </summary>
    public decimal? CostPrice { get; set; }

    /// <summary>
    /// Giá bán lẻ niêm yết.
    /// </summary>
    public decimal SalePrice { get; set; }

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
