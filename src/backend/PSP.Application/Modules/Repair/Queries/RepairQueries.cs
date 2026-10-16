using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Repair.DTOs;

namespace PSP.Application.Modules.Repair.Queries;

/// <summary>
/// Truy vấn lấy chi tiết Phiếu sửa chữa bằng ID.
/// </summary>
public record GetRepairTicketByIdQuery(Guid Id) : IRequest<RepairTicketDto>;

/// <summary>
/// Truy vấn lấy danh sách Phiếu sửa chữa có hỗ trợ lọc và phân trang.
/// </summary>
public record GetRepairTicketsQuery(
    int PageIndex = 1,
    int PageSize = 10,
    string? Code = null,
    string? Search = null,
    string? Status = null,
    Guid? CustomerId = null,
    Guid? TechnicianId = null,
    string? Queue = null,
    bool IncludeTest = false
) : IRequest<(IEnumerable<RepairTicketDto> Items, int TotalCount)>;

/// <summary>
/// Truy vấn thống kê số lượng phiếu trong các hàng chờ nghiệp vụ (Unassigned, My Tasks, In Progress, Completed, Total).
/// </summary>
public record GetRepairQueueStatsQuery(bool IncludeTest = false) : IRequest<RepairQueueStatsDto>;
