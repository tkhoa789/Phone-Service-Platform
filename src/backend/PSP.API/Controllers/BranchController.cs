using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Branch.Commands;
using PSP.Application.Modules.Branch.DTOs;
using PSP.Application.Modules.Branch.Queries;

using Microsoft.AspNetCore.Authorization;

namespace PSP.API.Controllers;

/// <summary>
/// Controller đóng vai trò như một "Lễ tân" của nhà hàng.
/// Khi có người dùng (hoặc giao diện web/app) gọi tới, "Lễ tân" sẽ tiếp nhận yêu cầu.
/// Lễ tân không tự nấu ăn (không tự xử lý logic), mà ghi lại order (Command/Query) 
/// rồi chuyển cho "Nhà bếp" (Mediator) xử lý. Sau đó lấy món ăn trả lại cho khách.
/// </summary>
[Authorize(Roles = "Owner,Admin,Manager")]
[Route("api/[controller]")] // Khai báo đường dẫn API, ví dụ: http://localhost:5000/api/Branch
[Tags("Branches")]
public class BranchController : BaseApiController
{
    /// <summary>
    /// API để tạo mới một chi nhánh (Dành riêng cho Owner & Admin).
    /// </summary>
    [Authorize(Roles = "Owner,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBranchCommand command, CancellationToken cancellationToken)
    {
        // 1. Chuyển yêu cầu tạo chi nhánh cho hệ thống Mediator (Đưa order xuống nhà bếp)
        // Kết quả trả về (result) sẽ là ID (chuỗi GUID) của chi nhánh vừa được tạo trong Database.
        var result = await Mediator.Send(command, cancellationToken);
        
        // 2. Trả kết quả về cho người dùng, bọc trong chiếc hộp chuẩn là ApiResponse.
        // Chữ "Ok" tương đương với mã HTTP 200 (Nghĩa là Thành công).
        return Ok(ApiResponse<Guid>.Success(result, "Tạo chi nhánh thành công"));
    }

    /// <summary>
    /// API để cập nhật (chỉnh sửa) thông tin chi nhánh (Dành riêng cho Owner & Admin).
    /// </summary>
    [Authorize(Roles = "Owner,Admin")]
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
    /// API để xóa một chi nhánh (Dành riêng cho Owner & Admin).
    /// </summary>
    [Authorize(Roles = "Owner,Admin")]
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
