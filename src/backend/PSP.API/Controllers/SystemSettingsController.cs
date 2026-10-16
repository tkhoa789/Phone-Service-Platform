using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Branch.Commands;
using PSP.Application.Modules.Branch.DTOs;
using PSP.Application.Modules.Branch.Queries;
using PSP.Domain.Common.Constants;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller Quản lý Cấu hình Hệ thống & Ngân hàng VietQR.
/// </summary>
[Authorize(Policy = Permissions.SystemSettings.View)]
[Route("api/[controller]")]
[Tags("SystemSettings")]
public class SystemSettingsController : BaseApiController
{
    /// <summary>
    /// API Lấy thông tin Cấu hình Thương hiệu & VietQR Ngân hàng hiện tại.
    /// GET: /api/SystemSettings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var query = new GetSystemSettingsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<SystemSettingsDto>.Success(result));
    }

    /// <summary>
    /// API Cập nhật Cấu hình Thương hiệu & Tài khoản Ngân hàng VietQR (SystemSettings.UPDATE - Owner only).
    /// PUT: /api/SystemSettings
    /// </summary>
    [HttpPut]
    [Authorize(Policy = Permissions.SystemSettings.Update)]
    public async Task<IActionResult> Update([FromBody] UpdateSystemSettingsCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật cấu hình hệ thống & VietQR thành công"));
    }
}
