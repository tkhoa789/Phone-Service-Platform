using MediatR;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

/// <summary>
/// QUERY (Yêu cầu truy vấn dữ liệu từ hệ thống - cam kết không chỉnh sửa, thêm hoặc xóa dữ liệu).
/// [Hành động 1]: Lấy chi tiết thông tin của một Nhà cung cấp cụ thể theo mã khóa chính Id.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<SupplierDto>", nghĩa là sau khi truy vấn thành công, kết quả trả về sẽ là một đối tượng "SupplierDto".
/// </summary>
public record GetSupplierByIdQuery(
    /// <summary>
    /// Id của nhà cung cấp cần tìm kiếm thông tin.
    /// </summary>
    Guid Id
) : IRequest<SupplierDto>;

/// <summary>
/// QUERY (Yêu cầu truy vấn dữ liệu từ hệ thống).
/// [Hành động 2]: Lấy toàn bộ danh sách các Nhà cung cấp đang hoạt động trong hệ thống.
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "IRequest<IEnumerable<SupplierDto>>", nghĩa là trả về một danh sách (danh sách có thể lặp qua - IEnumerable) chứa các đối tượng "SupplierDto".
/// </summary>
public record GetAllSuppliersQuery() : IRequest<IEnumerable<SupplierDto>>;

