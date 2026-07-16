using MediatR;

namespace PSP.Application.Modules.Product.Commands;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 1]: Tạo mới một Thương hiệu sản phẩm (ví dụ: Apple, Samsung...)
/// 
/// Lớp này kế thừa IRequest<Guid>, nghĩa là khi Command này được xử lý bởi MediatR Handler,
/// nó sẽ trả về kết quả là kiểu dữ liệu Guid (Id của thương hiệu vừa tạo).
/// </summary>
public record CreateBrandCommand(
    /// <summary>
    /// Mã thương hiệu (Ví dụ: "APPLE", "SAMSUNG"). Không được trùng lặp trong DB.
    /// </summary>
    string Code,

    /// <summary>
    /// Tên hiển thị của thương hiệu (Ví dụ: "Apple", "Samsung").
    /// </summary>
    string Name
) : IRequest<Guid>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 2]: Cập nhật thông tin của một Thương hiệu đã tồn tại.
/// 
/// Lớp này kế thừa IRequest<bool>, nghĩa là trả về true nếu cập nhật thành công, false nếu thất bại.
/// </summary>
public record UpdateBrandCommand(
    /// <summary>
    /// Khóa chính (Id) dạng Guid của thương hiệu cần cập nhật.
    /// </summary>
    Guid Id,

    /// <summary>
    /// Tên thương hiệu mới muốn thay đổi.
    /// (Lưu ý: Mã thương hiệu Code thường là duy nhất và không cho phép thay đổi sau khi tạo).
    /// </summary>
    string Name
) : IRequest<bool>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 3]: Xóa một thương hiệu sản phẩm (Xóa mềm - Soft Delete).
/// 
/// Lớp này kế thừa IRequest<bool>, trả về true nếu xóa thành công.
/// </summary>
public record DeleteBrandCommand(
    /// <summary>
    /// Id của thương hiệu cần xóa.
    /// </summary>
    Guid Id
) : IRequest<bool>;

