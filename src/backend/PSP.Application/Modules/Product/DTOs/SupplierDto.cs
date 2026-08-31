namespace PSP.Application.Modules.Product.DTOs;

/// <summary>
/// DATA TRANSFER OBJECT (Đối tượng trung chuyển dữ liệu).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này được sử dụng để đóng gói và gửi dữ liệu ra phía ngoài API (gửi về phía Web, Mobile client hiển thị).
/// - Tại sao không gửi thẳng thực thể Entity? Vì Entity chứa các thông tin nhạy cảm của cơ sở dữ liệu (ví dụ cờ IsDeleted, DeletedAt hoặc các mối quan hệ join phức tạp).
/// - Dùng DTO giúp bảo vệ cấu trúc database bên trong và chỉ phô bày những thông tin cần thiết nhất cho Client.
/// </summary>
public class SupplierDto
{
    /// <summary>
    /// Mã định danh duy nhất (Guid) của nhà cung cấp trong Database.
    /// Dùng để Client có thể lưu trữ và gọi ngược lại API khi cần sửa/xóa.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Mã viết tắt của nhà cung cấp (Ví dụ: "APPLE_VN").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Tên đầy đủ hiển thị của nhà cung cấp.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Số điện thoại liên lạc.
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Địa chỉ email.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Địa chỉ văn phòng/kho.
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Mã số thuế công ty nhà cung cấp.
    /// </summary>
    public string? TaxCode { get; set; }

    /// <summary>
    /// Số tiền nợ phải trả hiện tại cho Nhà cung cấp.
    /// </summary>
    public decimal DebtAmount { get; set; }

    /// <summary>
    /// Hạn mức nợ tối đa (Credit Limit) cho phép nợ.
    /// </summary>
    public decimal CreditLimit { get; set; }

    /// <summary>
    /// Số ngày được nợ thanh toán (Credit Term Days, e.g. 30 ngày).
    /// </summary>
    public int PaymentTermsDays { get; set; }

    /// <summary>
    /// Thời điểm nhà cung cấp này được tạo trên hệ thống.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Username của nhân viên đã tạo hồ sơ nhà cung cấp này.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Thời điểm hồ sơ này được chỉnh sửa gần nhất.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Username của nhân viên chỉnh sửa hồ sơ này gần nhất.
    /// </summary>
    public string? UpdatedBy { get; set; }
}

