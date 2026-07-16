using MediatR;

namespace PSP.Application.Modules.Product.Commands;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 1]: Tạo mới một Dòng sản phẩm (ví dụ: iPhone 16 Pro Max).
/// 
/// Giải thích cho người mới bắt đầu:
/// - "CreateProductCommand" là một record C# dùng để đóng gói dữ liệu Client gửi lên khi tạo sản phẩm.
/// - Kế thừa từ "IRequest<Guid>", nghĩa là sau khi MediatR Handler xử lý xong, nó sẽ trả về Id (Guid) của sản phẩm vừa tạo.
/// </summary>
public record CreateProductCommand(
    /// <summary>
    /// Id của Danh mục (Category) mà sản phẩm này thuộc về (Ví dụ: Id của danh mục "Điện thoại").
    /// </summary>
    Guid CategoryId,

    /// <summary>
    /// Id của Thương hiệu (Brand) của sản phẩm (Ví dụ: Id của hãng "Apple").
    /// </summary>
    Guid BrandId,

    /// <summary>
    /// Mã dòng sản phẩm (Ví dụ: "IPHONE_16_PM"). Không được trùng lặp trong DB.
    /// </summary>
    string Code,

    /// <summary>
    /// Tên của dòng sản phẩm (Ví dụ: "iPhone 16 Pro Max").
    /// </summary>
    string Name,

    /// <summary>
    /// Thông tin mô tả chi tiết hoặc thông số kỹ thuật của sản phẩm (Cho phép null/trống).
    /// </summary>
    string? Description
) : IRequest<Guid>;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 2]: Cập nhật thông tin của một Dòng sản phẩm đã tồn tại.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<bool>", trả về true nếu cập nhật thành công, ngược lại trả về false.
/// </summary>
public record UpdateProductCommand(
    /// <summary>
    /// Khóa chính (Id) của dòng sản phẩm cần cập nhật.
    /// </summary>
    Guid Id,

    /// <summary>
    /// Id của Danh mục mới nếu muốn thay đổi nhóm phân loại.
    /// </summary>
    Guid CategoryId,

    /// <summary>
    /// Id của Thương hiệu mới nếu muốn thay đổi.
    /// </summary>
    Guid BrandId,

    /// <summary>
    /// Tên dòng sản phẩm mới.
    /// </summary>
    string Name,

    /// <summary>
    /// Mô tả chi tiết mới.
    /// </summary>
    string? Description
) : IRequest<bool>;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 3]: Xóa một dòng sản phẩm (Xóa mềm - Soft Delete).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<bool>", trả về true nếu xóa thành công.
/// </summary>
public record DeleteProductCommand(
    /// <summary>
    /// Id của dòng sản phẩm cần xóa.
    /// </summary>
    Guid Id
) : IRequest<bool>;
