using MediatR;

namespace PSP.Application.Modules.Product.Commands;

/// <summary>
/// COMMAND (Lệnh yêu cầu thay đổi trạng thái của hệ thống - như Thêm, Sửa, Xóa).
/// [Hành động 1]: Thêm mới một Nhà cung cấp (Supplier) vào hệ thống.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này là một "record" (kiểu bản ghi) trong C#. Record rất phù hợp để làm DTO hoặc Command vì nó bất biến (không thể sửa đổi sau khi tạo).
/// - Lớp này kế thừa từ interface "IRequest<Guid>" của thư viện MediatR.
/// - Điều này báo hiệu cho MediatR biết: "Khi Command này được gửi đi, kết quả trả về cuối cùng sau khi xử lý thành công sẽ là một Guid (mã định danh duy nhất của Nhà cung cấp vừa được tạo)."
/// </summary>
public record CreateSupplierCommand(
    /// <summary>
    /// Mã viết tắt của nhà cung cấp (Ví dụ: "APPLE_VN", "SAMSUNG_RETAIL"). 
    /// Đây là mã duy nhất và không được phép trùng lặp trong cơ sở dữ liệu.
    /// </summary>
    string Code,

    /// <summary>
    /// Tên đầy đủ hiển thị của nhà cung cấp (Ví dụ: "Công ty TNHH Apple Việt Nam").
    /// </summary>
    string Name,

    /// <summary>
    /// Số điện thoại liên lạc chính thức (Cho phép null/trống nếu chưa có).
    /// </summary>
    string? Phone,

    /// <summary>
    /// Địa chỉ email liên lạc chính thức (Cho phép null/trống).
    /// </summary>
    string? Email,

    /// <summary>
    /// Địa chỉ văn phòng giao dịch hoặc kho của nhà cung cấp (Cho phép null/trống).
    /// </summary>
    string? Address
) : IRequest<Guid>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thay đổi trạng thái của hệ thống).
/// [Hành động 2]: Cập nhật (Sửa) thông tin của một Nhà cung cấp đang tồn tại.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<bool>", nghĩa là khi sửa thông tin thành công, Handler sẽ trả về kết quả kiểu boolean:
///   + true: Sửa thành công.
///   + false: Sửa thất bại.
/// </summary>
public record UpdateSupplierCommand(
    /// <summary>
    /// Khóa chính (Id) dạng Guid của nhà cung cấp cần sửa. 
    /// Dùng để tìm kiếm đúng dòng dữ liệu trong database để chỉnh sửa.
    /// </summary>
    Guid Id,

    /// <summary>
    /// Tên mới của nhà cung cấp muốn cập nhật.
    /// </summary>
    string Name,

    /// <summary>
    /// Số điện thoại mới.
    /// </summary>
    string? Phone,

    /// <summary>
    /// Email mới.
    /// </summary>
    string? Email,

    /// <summary>
    /// Địa chỉ mới.
    /// </summary>
    string? Address
) : IRequest<bool>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thay đổi trạng thái của hệ thống).
/// [Hành động 3]: Xóa một Nhà cung cấp khỏi hệ thống (Xóa mềm - Soft Delete).
/// 
/// Giải thích cho người mới bắt đầu:
/// - "Xóa mềm" có nghĩa là chúng ta không thực sự dùng lệnh SQL DELETE để xóa mất dòng dữ liệu trong DB.
/// - Chúng ta chỉ chuyển cờ trạng thái "IsDeleted = true". Bản ghi vẫn tồn tại trong DB nhưng hệ thống sẽ ẩn đi không hiển thị nữa.
/// - Kế thừa từ "IRequest<bool>", trả về true nếu xóa thành công.
/// </summary>
public record DeleteSupplierCommand(
    /// <summary>
    /// Id của nhà cung cấp muốn xóa.
    /// </summary>
    Guid Id
) : IRequest<bool>;

