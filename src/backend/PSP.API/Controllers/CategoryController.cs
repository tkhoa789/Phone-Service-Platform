using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER quản lý các API liên quan đến Danh mục sản phẩm (Categories).
/// </summary>
[Authorize(Policy = Permissions.Product.View)]
[Route("api/[controller]")]
[Tags("Categories")]
public class CategoryController : BaseApiController
{
    /// <summary>
    /// API Tạo mới danh mục sản phẩm (Product.CREATE).
    /// POST: /api/Category
    /// </summary>
    [Authorize(Policy = Permissions.Product.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo danh mục thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin danh mục (Product.UPDATE).
    /// PUT: /api/Category/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật danh mục thành công"));
    }

    /// <summary>
    /// API Xóa danh mục sản phẩm (Product.DELETE).
    /// DELETE: /api/Category/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Delete)]
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

