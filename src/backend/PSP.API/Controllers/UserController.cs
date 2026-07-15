using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Auth.Commands;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Application.Modules.Auth.Queries;

namespace PSP.API.Controllers;

/// <summary>
/// "Lễ tân" chuyên phụ trách luồng công việc liên quan đến tài khoản Nhân viên (User).
/// Không tự viết logic xử lý ở đây. Mọi yêu cầu đều đóng gói gửi xuống cho "Nhà bếp" (MediatR).
/// </summary>
[Route("api/[controller]")]
[Tags("Users")]
public class UserController : BaseApiController
{
    /// <summary>
    /// API Tạo mới người dùng (nhân viên).
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command, CancellationToken cancellationToken)
    {
        // Chuyển lệnh xuống Handler để lưu Database
        var result = await Mediator.Send(command, cancellationToken);
        
        // Trả về báo thành công
        return Ok(ApiResponse<Guid>.Success(result, "Tạo tài khoản người dùng thành công"));
    }

    /// <summary>
    /// API Sửa thông tin người dùng.
    /// Cần truyền vào ID trên URL (ví dụ: api/User/123-456-abc) và cục dữ liệu sửa nằm trong Body.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserCommand command, CancellationToken cancellationToken)
    {
        // Chống hack: Cố tình truyền 1 ID trên thanh địa chỉ, nhưng gửi ruột của 1 thằng khác.
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật người dùng thành công"));
    }

    /// <summary>
    /// API Xóa nhân viên khỏi hệ thống (Xóa mềm - ẩn đi chứ không xóa mất dữ liệu).
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteUserCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xóa người dùng thành công"));
    }

    /// <summary>
    /// Lấy thông tin chi tiết của 1 nhân viên duy nhất.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetUserByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<UserDto>.Success(result));
    }

    /// <summary>
    /// Lấy danh sách toàn bộ nhân viên.
    /// Có thể kèm theo bộ lọc chi nhánh. Ví dụ: GET api/User?branchId=xyz
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? branchId, CancellationToken cancellationToken)
    {
        var query = new GetAllUsersQuery(branchId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Success(result));
    }
}
