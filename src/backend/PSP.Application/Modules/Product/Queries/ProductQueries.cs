using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu từ hệ thống - không thay đổi trạng thái DB).
/// [Truy vấn 1]: Lấy chi tiết thông tin của một Dòng sản phẩm theo mã khóa chính Id.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<ProductDto>", nghĩa là Handler sẽ trả về đối tượng "ProductDto" chứa chi tiết sản phẩm và danh mục các biến thể của nó.
/// </summary>
public record GetProductByIdQuery(
    /// <summary>
    /// Id của dòng sản phẩm cần tìm.
    /// </summary>
    Guid Id
) : IRequest<ProductDto>;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu từ hệ thống).
/// [Truy vấn 2]: Lấy danh sách tất cả các Dòng sản phẩm đang hoạt động.
/// 
/// Kế thừa từ "IRequest<IEnumerable<ProductDto>>", trả về danh sách các "ProductDto".
/// </summary>
public record GetAllProductsQuery() : IRequest<IEnumerable<ProductDto>>;
