using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER (Lớp đón nhận và phản hồi các yêu cầu HTTP từ Client).
/// Quản lý toàn bộ API liên quan đến thực thể Nhà cung cấp (Suppliers).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "BaseApiController" để thừa hưởng thuộc tính "Mediator" (dịch vụ trung gian MediatR).
/// - Attribute [Route("api/[controller]")] chỉ định đường dẫn API sẽ tự động lấy theo tên của Controller (bỏ chữ Controller) -> /api/Supplier.
/// - Attribute [Tags("Suppliers")] giúp Swagger gom nhóm các API này vào mục "Suppliers" trên giao diện tài liệu trực quan.
/// - Ở đây, ta hoàn toàn không xử lý logic nghiệp vụ hay truy vấn SQL trực tiếp. Controller chỉ làm nhiệm vụ: nhận tham số -> bọc vào Command/Query -> gửi đi qua Mediator -> nhận kết quả trả về cho khách.
/// </summary>
[Route("api/[controller]")]
[Tags("Suppliers")]
public class SupplierController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Nhà cung cấp.
    /// POST: /api/Supplier
    /// </summary>
    /// <param name="command">Dữ liệu tạo mới được gửi lên trong phần BODY của HTTP Request</param>
    /// <param name="cancellationToken">Token quản lý cơ chế tự động hủy nếu client ngắt kết nối</param>
    /// <returns>Trả về Guid (Id) của nhà cung cấp mới được tạo thành công</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupplierCommand command, CancellationToken cancellationToken)
    {
        // Gửi lệnh tạo mới sang MediatR, chờ đợi Handler xử lý và trả về Guid
        var result = await Mediator.Send(command, cancellationToken);
        
        // Bọc kết quả thành công trong ApiResponse dạng JSON chuẩn
        return Ok(ApiResponse<Guid>.Success(result, "Tạo nhà cung cấp thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin Nhà cung cấp.
    /// PUT: /api/Supplier/{id}
    /// </summary>
    /// <param name="id">Id Guid của nhà cung cấp cần sửa, truyền trực tiếp trên URL</param>
    /// <param name="command">Dữ liệu mới cần cập nhật, truyền trong Body</param>
    /// <param name="cancellationToken">Token quản lý hủy request</param>
    /// <returns>Trả về true nếu cập nhật thành công</returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierCommand command, CancellationToken cancellationToken)
    {
        // Kiểm tra an toàn: Đảm bảo Id truyền trên URL khớp với Id trong body gửi lên.
        // Tránh tình huống sửa nhầm ID của bản ghi khác do sai lệch tham số.
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật nhà cung cấp thành công"));
    }

    /// <summary>
    /// API Xóa nhà cung cấp (Thực chất là cập nhật trạng thái cờ xóa mềm).
    /// DELETE: /api/Supplier/{id}
    /// </summary>
    /// <param name="id">Id của nhà cung cấp cần xóa, truyền trên URL</param>
    /// <param name="cancellationToken">Token quản lý hủy request</param>
    /// <returns>Trả về true nếu xóa thành công</returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        // Tạo lệnh xóa DeleteSupplierCommand với ID cần xóa và gửi qua Mediator
        var command = new DeleteSupplierCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa nhà cung cấp thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Nhà cung cấp theo ID.
    /// GET: /api/Supplier/{id}
    /// </summary>
    /// <param name="id">Id của nhà cung cấp cần tìm, truyền trên URL</param>
    /// <param name="cancellationToken">Token quản lý hủy request</param>
    /// <returns>Đối tượng SupplierDto chứa đầy đủ chi tiết</returns>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        // Đóng gói ID thành một Query để gửi qua Mediator truy vấn
        var query = new GetSupplierByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<SupplierDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả các Nhà cung cấp đang hoạt động.
    /// GET: /api/Supplier
    /// </summary>
    /// <param name="cancellationToken">Token quản lý hủy request</param>
    /// <returns>Mảng danh sách các SupplierDto</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllSuppliersQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<SupplierDto>>.Success(result));
    }
}

