namespace PSP.Application.Modules.Product.DTOs;

/// <summary>
/// DATA TRANSFER OBJECT (Đối tượng trung chuyển dữ liệu)
/// DTO này dùng để đóng gói và gửi thông tin Danh mục ra ngoài API (Client).
/// Ngoài các thông tin cơ bản, DTO này còn bổ sung thêm trường ParentName để hiển thị tên danh mục cha trực quan hơn.
/// </summary>
public class CategoryDto
{
    /// <summary>
    /// Mã định danh duy nhất (Guid) của danh mục trong DB.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Mã danh mục (Ví dụ: "MOBILE", "TABLET").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Tên danh mục hiển thị (Ví dụ: "Điện thoại", "Máy tính bảng").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Id của danh mục cha (Cho phép null nếu là danh mục gốc - không có cha).
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// Tên của danh mục cha. Được điền thủ công bằng cách tìm kiếm trong DB lúc query,
    /// giúp UI hiển thị tên cha dễ dàng (ví dụ: hiển thị "Apple" thay vì ID "e1d2c3b4...").
    /// </summary>
    public string? ParentName { get; set; }

    /// <summary>
    /// Thời điểm bản ghi được tạo ra trong hệ thống.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Người dùng đã tạo bản ghi này.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Thời điểm bản ghi được sửa đổi gần nhất.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Người dùng đã chỉnh sửa bản ghi này gần nhất.
    /// </summary>
    public string? UpdatedBy { get; set; }
}

