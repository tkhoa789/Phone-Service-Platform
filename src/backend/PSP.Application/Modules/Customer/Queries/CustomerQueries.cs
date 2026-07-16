using MediatR;
using PSP.Application.Modules.Customer.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Customer.Queries;

/// <summary>
/// QUERY lấy chi tiết thông tin Khách hàng theo ID.
/// </summary>
public record GetCustomerByIdQuery(Guid Id) : IRequest<CustomerDto>;

/// <summary>
/// QUERY tra cứu Khách hàng nhanh bằng số điện thoại.
/// </summary>
public record GetCustomerByPhoneQuery(string Phone) : IRequest<CustomerDto>;

/// <summary>
/// QUERY lấy danh sách Khách hàng có bộ lọc tìm kiếm.
/// </summary>
public record GetCustomersQuery(
    string? Keyword = null // Tìm theo tên hoặc số điện thoại
) : IRequest<IEnumerable<CustomerDto>>;
