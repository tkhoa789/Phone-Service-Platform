using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu, cam kết không thay đổi trạng thái hệ thống)
/// [Yêu cầu số 1]: Lấy chi tiết thông tin của một Danh mục dựa vào khóa chính Id.
/// 
/// Kế thừa IRequest<CategoryDto>, trả về đối tượng CategoryDto chứa chi tiết danh mục.
/// </summary>
public record GetCategoryByIdQuery(
    /// <summary>
    /// Id của danh mục cần lấy thông tin.
    /// </summary>
    Guid Id
) : IRequest<CategoryDto>;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu, cam kết không thay đổi trạng thái hệ thống)
/// [Yêu cầu số 2]: Lấy danh sách tất cả các Danh mục sản phẩm trong hệ thống (dạng danh sách phẳng, không phân nhánh cây ở mức DB).
/// 
/// Kế thừa IRequest<IEnumerable<CategoryDto>>, trả về danh sách các CategoryDto.
/// </summary>
public record GetAllCategoriesQuery() : IRequest<IEnumerable<CategoryDto>>;

