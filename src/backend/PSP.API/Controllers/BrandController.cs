using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER quản lý các API liên quan đến Thương hiệu sản phẩm (Brands).
/// </summary>
[Authorize(Policy = Permissions.Product.View)]
[Route("api/[controller]")]
[Tags("Brands")]
public class BrandController : BaseApiController
{
    /// <summary>
    /// API Tạo mới thương hiệu sản phẩm (Product.CREATE).
    /// POST: /api/Brand
    /// </summary>
    [Authorize(Policy = Permissions.Product.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBrandCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo thương hiệu thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin thương hiệu (Product.UPDATE).
    /// PUT: /api/Brand/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBrandCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật thương hiệu thành công"));
    }

    /// <summary>
    /// API Xóa thương hiệu (Product.DELETE).
    /// DELETE: /api/Brand/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
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

