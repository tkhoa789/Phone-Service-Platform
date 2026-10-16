using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Application.Modules.Auth.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER quản lý API truy vấn nhật ký thao tác hệ thống (Audit Logs).
/// </summary>
[Authorize(Policy = Permissions.AuditLog.View)]
[Route("api/[controller]")]
[Tags("AuditLogs")]
public class AuditLogController : BaseApiController
{
    /// <summary>
    /// API Lấy danh sách nhật ký hệ thống (Audit Logs) có phân trang và bộ lọc động.
    /// GET: /api/AuditLog
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? entityName = null,
        [FromQuery] string? action = null,
        [FromQuery] Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAuditLogsQuery(pageIndex, pageSize, entityName, action, userId);
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<object>.Success(new { items, totalCount }, "Lấy danh sách nhật ký hệ thống thành công."));
    }
}
