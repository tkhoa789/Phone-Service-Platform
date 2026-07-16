using MediatR;

namespace PSP.Application.Modules.Product.Commands;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 1]: Tạo mới một Biến thể sản phẩm (ví dụ: iPhone 16 Pro Max - 256GB - Màu Titan Sa Mạc).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Một dòng sản phẩm có thể có nhiều biến thể khác nhau về màu sắc, dung lượng và giá bán.
/// - Kế thừa từ "IRequest<Guid>", trả về Id (Guid) của biến thể vừa được tạo thành công.
/// </summary>
public record CreateProductVariantCommand(
    /// <summary>
    /// Id của Dòng sản phẩm cha (Ví dụ: Id của dòng máy "iPhone 16 Pro Max").
    /// </summary>
    Guid ProductId,

    /// <summary>
    /// Mã quản lý kho (Stock Keeping Unit - SKU). Ví dụ: "IP16PM-256-DESERT". 
    /// SKU này bắt buộc phải là duy nhất và không được trùng lặp trên toàn hệ thống.
    /// </summary>
    string Sku,

    /// <summary>
    /// Tên đầy đủ hiển thị của biến thể (Ví dụ: "iPhone 16 Pro Max 256GB Titan Sa Mạc").
    /// </summary>
    string Name,

    /// <summary>
    /// Màu sắc của biến thể (Ví dụ: "Titan Sa Mạc", "Titan Đen"). Cho phép null/trống.
    /// </summary>
    string? Color,

    /// <summary>
    /// Dung lượng bộ nhớ của biến thể (Ví dụ: "256GB", "512GB"). Cho phép null/trống.
    /// </summary>
    string? Capacity,

    /// <summary>
    /// Giá nhập kho gốc của biến thể (Ví dụ: 30000000.00). Bắt buộc và không được âm.
    /// </summary>
    decimal CostPrice,

    /// <summary>
    /// Giá bán lẻ niêm yết của biến thể (Ví dụ: 34990000.00). Bắt buộc và không được âm.
    /// </summary>
    decimal SalePrice
) : IRequest<Guid>;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 2]: Cập nhật thông tin của một Biến thể sản phẩm.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<bool>", trả về true nếu cập nhật thành công.
/// - Không cho phép cập nhật cột ProductId và Sku sau khi đã tạo để tránh phá vỡ tính toàn vẹn dữ liệu kho.
/// </summary>
public record UpdateProductVariantCommand(
    /// <summary>
    /// Khóa chính (Id) Guid của biến thể sản phẩm cần cập nhật.
    /// </summary>
    Guid Id,

    /// <summary>
    /// Tên mới của biến thể.
    /// </summary>
    string Name,

    /// <summary>
    /// Màu sắc mới.
    /// </summary>
    string? Color,

    /// <summary>
    /// Dung lượng mới.
    /// </summary>
    string? Capacity,

    /// <summary>
    /// Giá nhập kho mới.
    /// </summary>
    decimal CostPrice,

    /// <summary>
    /// Giá bán lẻ mới.
    /// </summary>
    decimal SalePrice
) : IRequest<bool>;

/// <summary>
/// COMMAND (Lệnh thay đổi trạng thái của hệ thống).
/// [Hành động 3]: Xóa một biến thể sản phẩm (Xóa mềm - Soft Delete).
/// 
/// Kế thừa từ "IRequest<bool>", trả về true nếu xóa thành công.
/// </summary>
public record DeleteProductVariantCommand(
    /// <summary>
    /// Id của biến thể sản phẩm cần xóa.
    /// </summary>
    Guid Id
) : IRequest<bool>;
