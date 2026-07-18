using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Warranty.DTOs;

namespace PSP.Application.Modules.Warranty.Queries;

/// <summary>
/// Truy vấn chi tiết Phiếu bảo hành theo ID.
/// </summary>
public record GetWarrantyTicketByIdQuery(Guid Id) : IRequest<WarrantyTicketDto>;

/// <summary>
/// Truy vấn danh sách Phiếu bảo hành có lọc và phân trang.
/// </summary>
public record GetWarrantyTicketsQuery(
    int PageIndex = 1,
    int PageSize = 10,
    string? Code = null,
    string? Status = null,
    Guid? CustomerId = null,
    string? Imei = null
) : IRequest<(IEnumerable<WarrantyTicketDto> Items, int TotalCount)>;

/// <summary>
/// Truy vấn kiểm tra thời hạn bảo hành của thiết bị qua mã IMEI.
/// </summary>
public record CheckWarrantyStatusQuery(string Imei) : IRequest<WarrantyCheckResultDto>;
