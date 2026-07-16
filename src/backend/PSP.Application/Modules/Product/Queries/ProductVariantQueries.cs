using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu từ hệ thống - không thay đổi trạng thái DB).
/// [Truy vấn 1]: Lấy chi tiết thông tin của một Biến thể sản phẩm theo mã khóa chính Id.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<ProductVariantDto>", trả về một "ProductVariantDto" chứa thông tin biến thể.
/// </summary>
public record GetProductVariantByIdQuery(
    /// <summary>
    /// Id của biến thể sản phẩm cần tìm.
    /// </summary>
    Guid Id
) : IRequest<ProductVariantDto>;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu từ hệ thống).
/// [Truy vấn 2]: Lấy tất cả biến thể thuộc về một dòng máy cha cụ thể (ProductId).
/// 
/// Kế thừa từ "IRequest<IEnumerable<ProductVariantDto>>", trả về danh sách các biến thể của dòng máy.
/// </summary>
public record GetProductVariantsByProductIdQuery(
    /// <summary>
    /// Id của dòng sản phẩm cha cần lấy danh sách biến thể.
    /// </summary>
    Guid ProductId
) : IRequest<IEnumerable<ProductVariantDto>>;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu từ hệ thống).
/// [Truy vấn 3]: Lấy toàn bộ biến thể sản phẩm đang hoạt động trên hệ thống (để chọn khi nhập kho hoặc bán hàng).
/// 
/// Kế thừa từ "IRequest<IEnumerable<ProductVariantDto>>", trả về danh sách tất cả biến thể.
/// </summary>
public record GetAllProductVariantsQuery() : IRequest<IEnumerable<ProductVariantDto>>;
