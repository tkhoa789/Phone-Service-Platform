using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Notification.Commands;
using PSP.Application.Modules.Notification.DTOs;
using PSP.Application.Modules.Notification.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

[Authorize(Policy = Permissions.Notification.View)]
[Route("api/[controller]")]
[Tags("Notifications")]
public class NotificationController : BaseApiController
{
    /// <summary>
    /// API Lấy danh sách thông báo của người dùng hiện tại (có phân trang).
    /// GET: /api/Notification
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyNotificationsQuery(pageIndex, pageSize);
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<object>.Success(new { items, totalCount }, "Lấy danh sách thông báo thành công."));
    }

    /// <summary>
    /// API Lấy số lượng thông báo chưa đọc của người dùng hiện tại.
    /// GET: /api/Notification/unread-count
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var query = new GetUnreadNotificationCountQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<int>.Success(result, "Lấy số lượng thông báo chưa đọc thành công."));
    }

    /// <summary>
    /// API Đánh dấu một thông báo là đã đọc.
    /// PUT: /api/Notification/{id}/read
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var command = new MarkNotificationAsReadCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy thông báo cần sửa."));
        }
        return Ok(ApiResponse<bool>.Success(result, "Đánh dấu đã đọc thành công."));
    }

    /// <summary>
    /// API Đánh dấu TẤT CẢ thông báo của người dùng hiện tại là đã đọc.
    /// PUT: /api/Notification/read-all
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var command = new MarkAllNotificationsAsReadCommand();
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Đánh dấu tất cả đã đọc thành công."));
    }

    /// <summary>
    /// API Xóa mềm một thông báo (chuyển vào thùng rác).
    /// DELETE: /api/Notification/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteNotificationCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy thông báo cần xóa."));
        }
        return Ok(ApiResponse<bool>.Success(result, "Đã chuyển thông báo vào thùng rác."));
    }

    /// <summary>
    /// API Dọn dẹp: Xóa mềm tất cả thông báo hiện có (chuyển vào thùng rác).
    /// DELETE: /api/Notification/clear-all
    /// </summary>
    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllNotifications(CancellationToken cancellationToken)
    {
        var command = new ClearAllNotificationsCommand();
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Đã dọn dẹp tất cả thông báo vào thùng rác."));
    }

    /// <summary>
    /// API Lấy danh sách thông báo trong thùng rác của người dùng hiện tại.
    /// GET: /api/Notification/trash
    /// </summary>
    [HttpGet("trash")]
    public async Task<IActionResult> GetTrashNotifications(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetTrashNotificationsQuery(pageIndex, pageSize);
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<object>.Success(new { items, totalCount }, "Lấy danh sách thùng rác thành công."));
    }

    /// <summary>
    /// API Xóa vĩnh viễn một thông báo khỏi hệ thống (Hard Delete).
    /// DELETE: /api/Notification/{id}/permanent
    /// </summary>
    [HttpDelete("{id:guid}/permanent")]
    public async Task<IActionResult> PermanentDeleteNotification(Guid id, CancellationToken cancellationToken)
    {
        var command = new PermanentDeleteNotificationCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy thông báo trong thùng rác."));
        }
        return Ok(ApiResponse<bool>.Success(result, "Đã xóa vĩnh viễn thông báo."));
    }

    /// <summary>
    /// API Dọn sạch toàn bộ thùng rác (Xóa vĩnh viễn tất cả thông báo đã xóa).
    /// DELETE: /api/Notification/trash/clear-all
    /// </summary>
    [HttpDelete("trash/clear-all")]
    public async Task<IActionResult> ClearTrash(CancellationToken cancellationToken)
    {
        var command = new ClearTrashNotificationsCommand();
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Đã làm trống thùng rác thành công."));
    }

    /// <summary>
    /// API gửi thông báo khẩn tới người dùng cụ thể (Notification.SEND - Owner, Admin, Manager).
    /// POST: /api/Notification/send
    /// </summary>
    [HttpPost("send")]
    [Authorize(Policy = Permissions.Notification.Send)]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Gửi thông báo thành công."));
    }
}
