using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER (Lớp tiếp nhận các yêu cầu HTTP từ Client)
/// Quản lý các API liên quan đến Danh mục sản phẩm (Categories).
/// Cho phép tạo danh mục cha-con đa cấp.
/// </summary>
[Route("api/[controller]")]
[Tags("Categories")]
public class CategoryController : BaseApiController
{
    /// <summary>
    /// API Tạo mới danh mục sản phẩm (Hỗ trợ danh mục cha-con).
    /// POST: /api/Category
    /// </summary>
    /// <param name="command">Dữ liệu tạo danh mục (mã, tên, parentId)</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về Guid của danh mục vừa tạo</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo danh mục thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin danh mục.
    /// PUT: /api/Category/{id}
    /// </summary>
    /// <param name="id">Id danh mục cần cập nhật trên URL</param>
    /// <param name="command">Dữ liệu cập nhật mới trong body request</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về true nếu cập nhật thành công</returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        // Kiểm tra tính đồng nhất của Id
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật danh mục thành công"));
    }

    /// <summary>
    /// API Xóa danh mục sản phẩm (Xóa mềm).
    /// DELETE: /api/Category/{id}
    /// </summary>
    /// <param name="id">Id danh mục cần xóa</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Trả về true nếu xóa thành công</returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteCategoryCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa danh mục thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin danh mục theo ID.
    /// GET: /api/Category/{id}
    /// </summary>
    /// <param name="id">Id danh mục cần tìm</param>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>CategoryDto chi tiết</returns>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetCategoryByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<CategoryDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả danh mục (Dưới dạng phẳng phẳng, chứa ParentName để hiển thị trực quan).
    /// GET: /api/Category
    /// </summary>
    /// <param name="cancellationToken">Token quản lý hủy request bất đồng bộ</param>
    /// <returns>Danh sách các CategoryDto</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllCategoriesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<CategoryDto>>.Success(result));
    }
}

