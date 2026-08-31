using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER (Lớp tiếp nhận các yêu cầu HTTP từ Client)
/// Quản lý các API liên quan đến Thương hiệu sản phẩm (Brands).
/// Kế thừa BaseApiController để sử dụng chung thuộc tính Mediator (MediatR), giúp gửi lệnh/truy vấn xuống tầng nghiệp vụ xử lý.
/// </summary>
[Authorize]
[Route("api/[controller]")]
[Tags("Brands")]
public class BrandController : BaseApiController
{
    /// <summary>
    /// API Tạo mới thương hiệu sản phẩm.
    /// POST: /api/Brand
    /// </summary>
    /// <param name="command">Dữ liệu tạo mới thương hiệu (mã, tên)</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về ApiResponse chứa Id của thương hiệu vừa tạo</returns>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBrandCommand command, CancellationToken cancellationToken)
    {
        // Gửi Command sang MediatR Handler xử lý nghiệp vụ
        var result = await Mediator.Send(command, cancellationToken);
        
        // Bọc kết quả thành công trong ApiResponse chuẩn hóa
        return Ok(ApiResponse<Guid>.Success(result, "Tạo thương hiệu thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin thương hiệu.
    /// PUT: /api/Brand/{id}
    /// </summary>
    /// <param name="id">Id của thương hiệu cần cập nhật trên URL</param>
    /// <param name="command">Dữ liệu cập nhật mới trong body request</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về true nếu cập nhật thành công</returns>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBrandCommand command, CancellationToken cancellationToken)
    {
        // Kiểm tra an toàn: Đảm bảo Id truyền trên URL khớp với Id trong body gửi lên
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật thương hiệu thành công"));
    }

    /// <summary>
    /// API Xóa thương hiệu (Thực hiện xóa mềm trong Database).
    /// DELETE: /api/Brand/{id}
    /// </summary>
    /// <param name="id">Id của thương hiệu muốn xóa</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về true nếu xóa thành công</returns>
    [Authorize(Roles = "Owner,Admin,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        // Chuyển Id thành DeleteBrandCommand để gửi qua Mediator
        var command = new DeleteBrandCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa thương hiệu thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin thương hiệu theo ID.
    /// GET: /api/Brand/{id}
    /// </summary>
    /// <param name="id">Id thương hiệu cần lấy thông tin</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>BrandDto chứa thông tin chi tiết</returns>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        // Chuyển tham số truy vấn thành GetBrandByIdQuery gửi qua Mediator
        var query = new GetBrandByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<BrandDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả các thương hiệu.
    /// GET: /api/Brand
    /// </summary>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Danh sách các BrandDto</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllBrandsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<BrandDto>>.Success(result));
    }
}

