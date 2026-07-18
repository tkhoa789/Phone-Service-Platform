using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Sales.DTOs;

namespace PSP.Application.Modules.Sales.Queries;

/// <summary>
/// Các câu hỏi truy vấn (Queries) dùng để ĐỌC dữ liệu từ bảng SalesOrders.
/// </summary>

/// <summary>
/// Lấy thông tin chi tiết một đơn hàng kèm theo danh sách mặt hàng của nó theo ID đơn hàng.
/// </summary>
public record GetSalesOrderByIdQuery(Guid Id) : IRequest<SalesOrderDto>;

/// <summary>
/// Lấy danh sách lịch sử mua hàng của một Khách hàng cụ thể.
/// </summary>
public record GetSalesOrdersByCustomerIdQuery(Guid CustomerId) : IRequest<IEnumerable<SalesOrderDto>>;

/// <summary>
/// Lấy danh sách tất cả các đơn hàng bán lẻ trong hệ thống.
/// </summary>
public record GetAllSalesOrdersQuery : IRequest<IEnumerable<SalesOrderDto>>;
