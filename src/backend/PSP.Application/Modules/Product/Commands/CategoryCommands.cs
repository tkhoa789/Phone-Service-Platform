using MediatR;

namespace PSP.Application.Modules.Product.Commands;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 1]: Tạo mới một Danh mục sản phẩm (ví dụ: Điện thoại, Laptop...).
/// Hỗ trợ thiết lập mối quan hệ cha-con (ví dụ: Điện thoại > iPhone).
/// 
/// Lớp này kế thừa IRequest<Guid>, trả về Id (Guid) của danh mục vừa tạo thành công.
/// </summary>
public record CreateCategoryCommand(
    /// <summary>
    /// Mã danh mục (Ví dụ: "MOBILE", "LAPTOP"). Không trùng lặp trong hệ thống.
    /// </summary>
    string Code,

    /// <summary>
    /// Tên hiển thị của danh mục (Ví dụ: "Điện thoại", "Máy tính xách tay").
    /// </summary>
    string Name,

    /// <summary>
    /// Id của danh mục cha nếu có (Cho phép null nếu danh mục này ở cấp cao nhất - Root).
    /// </summary>
    Guid? ParentId
) : IRequest<Guid>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 2]: Cập nhật thông tin danh mục sản phẩm.
/// 
/// Lớp này kế thừa IRequest<bool>, trả về true nếu cập nhật thành công.
/// </summary>
public record UpdateCategoryCommand(
    /// <summary>
    /// Id của danh mục cần cập nhật.
    /// </summary>
    Guid Id,

    /// <summary>
    /// Tên mới muốn thay đổi.
    /// </summary>
    string Name,

    /// <summary>
    /// Id của danh mục cha mới (Cho phép null nếu muốn đưa danh mục này về cấp cao nhất).
    /// </summary>
    Guid? ParentId
) : IRequest<bool>;

/// <summary>
/// COMMAND (Lệnh yêu cầu thực thi hành động thay đổi trạng thái hệ thống)
/// [Yêu cầu số 3]: Xóa một danh mục sản phẩm (Xóa mềm).
/// 
/// Lớp này kế thừa IRequest<bool>, trả về true nếu xóa thành công.
/// </summary>
public record DeleteCategoryCommand(
    /// <summary>
    /// Id của danh mục cần xóa.
    /// </summary>
    Guid Id
) : IRequest<bool>;

