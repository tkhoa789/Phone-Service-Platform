using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Dashboard.DTOs;
using PSP.Application.Modules.Dashboard.Queries;
using PSP.Domain.Common.Constants;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// CONTROLLER phục vụ các API lấy số liệu báo cáo & tổng quan hệ thống.
/// </summary>
[Authorize(Policy = Permissions.Dashboard.View)]
[Route("api/[controller]")]
[ApiController]
public class DashboardController : BaseApiController
{
    /// <summary>
    /// API lấy thông tin Dashboard tổng hợp cho Quản lý / Admin.
    /// Cho phép Admin truyền tham số branchId để xem dữ liệu lọc theo chi nhánh.
    /// Manager gọi API sẽ bị ép buộc chỉ xem chi nhánh của mình ở tầng Handler (BR-1201).
    /// 
    /// GET: /api/Dashboard
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetManagerDashboard(
        [FromQuery] Guid? branchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetManagerDashboardQuery(branchId);
        var result = await Mediator.Send(query, cancellationToken);
        
        return Ok(ApiResponse<ManagerDashboardDto>.Success(result, "Lấy dữ liệu Dashboard tổng hợp thành công."));
    }
}
