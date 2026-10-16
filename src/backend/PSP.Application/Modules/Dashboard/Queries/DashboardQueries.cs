using MediatR;
using PSP.Application.Modules.Dashboard.DTOs;
using System;

namespace PSP.Application.Modules.Dashboard.Queries;

/// <summary>
/// Truy vấn lấy thông tin Dashboard tổng hợp của Quản lý.
/// </summary>
/// <param name="BranchId">ID chi nhánh cần lọc (chỉ có tác dụng đối với tài khoản Admin/Owner). Nếu null sẽ lấy toàn bộ chi nhánh.</param>
public record GetManagerDashboardQuery(Guid? BranchId = null) : IRequest<ManagerDashboardDto>;
