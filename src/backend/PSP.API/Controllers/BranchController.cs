using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Branch.Commands;
using PSP.Application.Modules.Branch.DTOs;
using PSP.Application.Modules.Branch.Queries;

using Microsoft.AspNetCore.Authorization;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// "Lễ tân" quản lý thông tin các Chi nhánh trong chuỗi cửa hàng PSP.
/// </summary>
[Authorize(Policy = Permissions.Branch.View)]
[Route("api/[controller]")]
[Tags("Branches")]
public class BranchController : BaseApiController
{
    /// <summary>
    /// API để tạo mới một chi nhánh (Branch.CREATE - Owner).
    /// </summary>
    [Authorize(Policy = Permissions.Branch.Create)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBranchCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tạo chi nhánh thành công"));
    }

    /// <summary>
    /// API để cập nhật thông tin chi nhánh (Branch.UPDATE - Owner, Admin).
    /// </summary>
    [Authorize(Policy = Permissions.Branch.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật chi nhánh thành công"));
    }

    /// <summary>
    /// API để xóa một chi nhánh (Branch.DELETE - Owner).
    /// </summary>
    [Authorize(Policy = Permissions.Branch.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        // 1. Đóng gói ID cần xóa thành một Lệnh (Command)
        var command = new DeleteBranchCommand(id);
        
        // 2. Gửi lệnh đi xử lý
        var result = await Mediator.Send(command, cancellationToken);
        
        // 3. Trả kết quả
        return Ok(ApiResponse<bool>.Success(result, "Xóa chi nhánh thành công"));
    }

    /// <summary>
    /// API để xem chi tiết 1 chi nhánh cụ thể dựa vào ID.
    /// Phương thức GET dùng để ĐỌC / LẤY dữ liệu.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        // Đóng gói thành Câu hỏi (Query)
        var query = new GetBranchByIdQuery(id);
        
        // Gửi câu hỏi đi và nhận về Dữ liệu chi nhánh (BranchDto)
        var result = await Mediator.Send(query, cancellationToken);
        
        // Trả dữ liệu cho khách hàng
        return Ok(ApiResponse<BranchDto>.Success(result));
    }

    /// <summary>
    /// API để lấy danh sách TẤT CẢ chi nhánh.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetAllBranchesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        
        return Ok(ApiResponse<IEnumerable<BranchDto>>.Success(result));
    }
}
