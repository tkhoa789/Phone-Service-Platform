using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các mã giảm giá cá nhân (Vouchers).
/// </summary>
[Authorize(Policy = Permissions.Voucher.View)]
[Route("api/[controller]")]
[Tags("Vouchers")]
public class VoucherController : BaseApiController
{
    /// <summary>
    /// API Tạo mới mã Voucher giảm giá (Voucher.CREATE).
    /// POST: /api/Voucher
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo Voucher thành công"));
    }

    /// <summary>
    /// API Cập nhật thông tin mã Voucher (Voucher.UPDATE).
    /// PUT: /api/Voucher/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVoucherCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật Voucher thành công"));
    }

    /// <summary>
    /// API Xóa mềm Voucher (Voucher.DELETE).
    /// DELETE: /api/Voucher/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteVoucherCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa Voucher thành công"));
    }

    /// <summary>
    /// API Lấy chi tiết thông tin Voucher theo ID.
    /// GET: /api/Voucher/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetVoucherByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<VoucherDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách toàn bộ các mã Voucher.
    /// GET: /api/Voucher
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllVouchersQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<VoucherDto>>.Success(result));
    }

    /// <summary>
    /// API Tìm kiếm chi tiết Voucher bằng chữ mã Code (ví dụ: /api/Voucher/code/GIAM30K).
    /// GET: /api/Voucher/code/{code}
    /// </summary>
    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var query = new GetVoucherByCodeQuery(code);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<VoucherDto>.Success(result));
    }

    /// <summary>
    /// API KIỂM TRA HỢP LỆ VOUCHER (Voucher.APPLY).
    /// GET: /api/Voucher/validate?code=VIP100K&orderValue=1500000
    /// </summary>
    [Authorize(Policy = Permissions.Voucher.Apply)]
    [HttpGet("validate")]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal orderValue, CancellationToken cancellationToken)
    {
        var query = new ValidateVoucherQuery(code, orderValue);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<VoucherDto>.Success(result, "Mã giảm giá hợp lệ để áp dụng"));
    }
}
