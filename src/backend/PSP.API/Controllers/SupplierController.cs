using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

[Authorize(Policy = Permissions.Supplier.View)]
[Route("api/[controller]")]
[Tags("Suppliers")]
public class SupplierController : BaseApiController
{
    [Authorize(Policy = Permissions.Supplier.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupplierCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo nhà cung cấp thành công"));
    }

    [Authorize(Policy = Permissions.Supplier.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật nhà cung cấp thành công"));
    }

    [Authorize(Policy = Permissions.Supplier.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteSupplierCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa nhà cung cấp thành công"));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSupplierByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<SupplierDto>.Success(result));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllSuppliersQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<SupplierDto>>.Success(result));
    }

    [Authorize(Policy = Permissions.Supplier.PayDebt)]
    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> PayDebt(Guid id, [FromBody] PaySupplierDebtCommand command, CancellationToken cancellationToken)
    {
        if (id != command.SupplierId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id nhà cung cấp không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Thanh toán công nợ nhà cung cấp thành công"));
    }

    [Authorize(Policy = Permissions.Supplier.View)]
    [HttpGet("{id:guid}/ledger")]
    public async Task<IActionResult> GetDebtLedger(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetSupplierDebtLedgerQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<SupplierDebtTransactionDto>>.Success(result));
    }
}
