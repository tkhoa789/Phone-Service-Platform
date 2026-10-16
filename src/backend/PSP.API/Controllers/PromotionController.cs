using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các Chương trình khuyến mãi (Promotions).
/// </summary>
[Authorize(Policy = Permissions.Voucher.View)]
[Route("api/[controller]")]
[Tags("Promotions")]
public class PromotionController : BaseApiController
{
    /// <summary>
    /// API Tạo mới chương trình khuyến mãi (Voucher.CREATE).
    /// POST: /api/Promotion
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromotionCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo chương trình khuyến mãi thành công"));
    }

    /// <summary>
    /// API Cập nhật chương trình khuyến mãi (Voucher.UPDATE).
    /// PUT: /api/Promotion/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePromotionCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật chương trình khuyến mãi thành công"));
    }

    /// <summary>
    /// API Xóa mềm chương trình khuyến mãi (Voucher.DELETE).
    /// DELETE: /api/Promotion/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePromotionCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa chương trình khuyến mãi thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin một chương trình khuyến mãi.
    /// GET: /api/Promotion/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPromotionByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PromotionDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách toàn bộ chương trình khuyến mãi.
    /// GET: /api/Promotion
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllPromotionsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<PromotionDto>>.Success(result));
    }
}
