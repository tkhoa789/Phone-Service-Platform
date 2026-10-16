using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER quản lý toàn bộ các API liên quan đến Dòng sản phẩm (Products) và Biến thể sản phẩm (Product Variants).
/// </summary>
[Authorize(Policy = Permissions.Product.View)]
[Route("api/[controller]")]
[Tags("Products")]
public class ProductController : BaseApiController
{
    // =========================================================================
    // SECTION 1: DÒNG SẢN PHẨM (PRODUCTS) - CRUD ENDPOINTS
    // =========================================================================

    /// <summary>
    /// API Tạo mới một Dòng sản phẩm (Product.CREATE).
    /// POST: /api/Product
    /// </summary>
    [Authorize(Policy = Permissions.Product.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo dòng sản phẩm thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin dòng sản phẩm (Product.UPDATE).
    /// PUT: /api/Product/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và Body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật thông tin sản phẩm thành công"));
    }

    /// <summary>
    /// API Xóa dòng sản phẩm (Product.DELETE).
    /// DELETE: /api/Product/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteProductCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa dòng sản phẩm thành công"));
    }

    /// <summary>
    /// API Lấy thông tin chi tiết một dòng sản phẩm theo Id (Kèm theo danh sách các biến thể con).
    /// GET: /api/Product/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetProductByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<ProductDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách dòng sản phẩm có phân trang và filter.
    /// GET: /api/Product
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProductsPaged([FromQuery] GetProductsPagedQuery query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ProductDto>>.Success(result));
    }

    // =========================================================================
    // SECTION 2: BIẾN THỂ SẢN PHẨM (PRODUCT VARIANTS) - CRUD ENDPOINTS
    // =========================================================================

    /// <summary>
    /// API Tạo mới một Biến thể sản phẩm (Product.CREATE).
    /// POST: /api/Product/Variant
    /// </summary>
    [Authorize(Policy = Permissions.Product.Create)]
    [HttpPost("Variant")]
    public async Task<IActionResult> CreateVariant([FromBody] CreateProductVariantCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo biến thể sản phẩm thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin cấu hình, giá của biến thể sản phẩm (Product.UPDATE).
    /// PUT: /api/Product/Variant/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Update)]
    [HttpPut("Variant/{id:guid}")]
    public async Task<IActionResult> UpdateVariant(Guid id, [FromBody] UpdateProductVariantCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và Body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật biến thể sản phẩm thành công"));
    }

    /// <summary>
    /// API Xóa biến thể sản phẩm (Product.DELETE).
    /// DELETE: /api/Product/Variant/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Product.Delete)]
    [HttpDelete("Variant/{id:guid}")]
    public async Task<IActionResult> DeleteVariant(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteProductVariantCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa biến thể sản phẩm thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin một biến thể sản phẩm theo Id.
    /// GET: /api/Product/Variant/{id}
    /// </summary>
    [HttpGet("Variant/{id:guid}")]
    public async Task<IActionResult> GetVariantById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetProductVariantByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<ProductVariantDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả các biến thể thuộc về một dòng sản phẩm cha (ProductId).
    /// GET: /api/Product/{productId}/Variants
    /// </summary>
    [HttpGet("{productId:guid}/Variants")]
    public async Task<IActionResult> GetVariantsByProductId(Guid productId, CancellationToken cancellationToken)
    {
        var query = new GetProductVariantsByProductIdQuery(productId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ProductVariantDto>>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách tất cả các biến thể đang hoạt động trên hệ thống.
    /// GET: /api/Product/Variant
    /// </summary>
    [HttpGet("Variant")]
    public async Task<IActionResult> GetAllVariants(CancellationToken cancellationToken)
    {
        var query = new GetAllProductVariantsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ProductVariantDto>>.Success(result));
    }
}
