namespace PSP.Application.Modules.Product.DTOs;

/// <summary>
/// DATA TRANSFER OBJECT (Đối tượng trung chuyển dữ liệu)
/// DTO này dùng để đóng gói và gửi dữ liệu Thương hiệu ra ngoài API (Client).
/// Việc sử dụng DTO giúp bảo vệ thực thể gốc (Entity) không bị lộ cấu trúc DB hoặc các trường nhạy cảm.
/// </summary>
public class BrandDto
{
    /// <summary>
    /// Mã định danh duy nhất (Guid) của thương hiệu trong Cơ sở dữ liệu.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Mã viết tắt của thương hiệu (Ví dụ: "APPLE", "SAMSUNG").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Tên đầy đủ hiển thị trên UI (Ví dụ: "Apple", "Samsung").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Thời điểm bản ghi được tạo ra trong hệ thống.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Username của người dùng hoặc hệ thống đã tạo bản ghi này.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Thời điểm bản ghi được chỉnh sửa gần nhất.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Username của người chỉnh sửa bản ghi này gần nhất.
    /// </summary>
    public string? UpdatedBy { get; set; }
}

