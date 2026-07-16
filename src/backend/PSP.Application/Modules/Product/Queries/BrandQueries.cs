using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu, cam kết không thay đổi trạng thái hệ thống)
/// [Yêu cầu số 1]: Truy vấn thông tin chi tiết của một Thương hiệu dựa vào khóa chính Id.
/// 
/// Kế thừa IRequest<BrandDto>, nghĩa là Handler xử lý truy vấn này sẽ trả về đối tượng BrandDto.
/// </summary>
public record GetBrandByIdQuery(
    /// <summary>
    /// Id (Guid) của thương hiệu cần tìm.
    /// </summary>
    Guid Id
) : IRequest<BrandDto>;

/// <summary>
/// QUERY (Truy vấn lấy dữ liệu, cam kết không thay đổi trạng thái hệ thống)
/// [Yêu cầu số 2]: Lấy danh sách tất cả các Thương hiệu sản phẩm đang hoạt động (chưa bị xóa mềm).
/// 
/// Kế thừa IRequest<IEnumerable<BrandDto>>, trả về danh sách các BrandDto.
/// </summary>
public record GetAllBrandsQuery() : IRequest<IEnumerable<BrandDto>>;

