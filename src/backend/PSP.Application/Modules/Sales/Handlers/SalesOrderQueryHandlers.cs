using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các truy vấn (Queries) đọc dữ liệu đơn hàng bán lẻ.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này truy vấn thông tin đơn hàng, chi tiết đơn hàng, kết hợp tên khách hàng, tên nhân viên, tên chi nhánh.
/// - Hoàn toàn không sử dụng EF Core Include ở tầng Application để đảm bảo kiến trúc sạch sẽ và độc lập với CSDL.
/// </summary>
public class SalesOrderQueryHandlers :
    IRequestHandler<GetSalesOrderByIdQuery, SalesOrderDto>,
    IRequestHandler<GetSalesOrdersByCustomerIdQuery, IEnumerable<SalesOrderDto>>,
    IRequestHandler<GetAllSalesOrdersQuery, IEnumerable<SalesOrderDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public SalesOrderQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy chi tiết đơn hàng bán theo ID.
    /// </summary>
    public async Task<SalesOrderDto> Handle(GetSalesOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tìm đơn hàng chính
        var order = await salesOrderRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (order == null)
        {
            throw new NotFoundException("Đơn hàng", request.Id);
        }

        // 2. Nạp tuần tự thông tin khách hàng, nhân viên, chi nhánh, voucher liên quan (EF Core không thread-safe)
        var customer = await customerRepo.GetByIdAsNoTrackingAsync(order.CustomerId, cancellationToken);
        var user = await userRepo.GetByIdAsNoTrackingAsync(order.UserId, cancellationToken);
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(order.BranchId, cancellationToken);
        var voucher = order.VoucherId.HasValue 
            ? await voucherRepo.GetByIdAsNoTrackingAsync(order.VoucherId.Value, cancellationToken)
            : null;

        // 3. Lấy toàn bộ chi tiết sản phẩm của đơn hàng
        var items = await salesOrderItemRepo.FindAsNoTrackingAsync(x => x.SalesOrderId == order.Id, cancellationToken);
        var itemDtos = new List<SalesOrderItemDto>();

        foreach (var item in items)
        {
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(item.ProductVariantId, cancellationToken);
            itemDtos.Add(new SalesOrderItemDto
            {
                Id = item.Id,
                ProductVariantId = item.ProductVariantId,
                ProductName = variant?.Name ?? "Sản phẩm không xác định",
                Sku = variant?.Sku ?? string.Empty,
                Imei = item.Imei,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount
            });
        }

        // 4. Map sang SalesOrderDto
        var orderDto = new SalesOrderDto
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName = customer?.FullName ?? "Vãng lai",
            CustomerPhone = customer?.Phone ?? string.Empty,
            UserId = order.UserId,
            UserFullName = user?.FullName ?? "Hệ thống",
            BranchId = order.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            VoucherId = order.VoucherId,
            VoucherCode = voucher?.Code,
            Code = order.Code,
            Status = order.Status,
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            Total = order.Total,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Items = itemDtos
        };

        return orderDto;
    }

    /// <summary>
    /// Lấy lịch sử tất cả các đơn hàng đã mua của một khách hàng.
    /// </summary>
    public async Task<IEnumerable<SalesOrderDto>> Handle(GetSalesOrdersByCustomerIdQuery request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var orders = await salesOrderRepo.FindAsNoTrackingAsync(x => x.CustomerId == request.CustomerId, cancellationToken);

        var result = new List<SalesOrderDto>();
        foreach (var order in orders)
        {
            var dto = await Handle(new GetSalesOrderByIdQuery(order.Id), cancellationToken);
            result.Add(dto);
        }

        return result;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ đơn hàng trong hệ thống.
    /// </summary>
    public async Task<IEnumerable<SalesOrderDto>> Handle(GetAllSalesOrdersQuery request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var orders = await salesOrderRepo.GetAllAsNoTrackingAsync(cancellationToken);

        var result = new List<SalesOrderDto>();
        foreach (var order in orders)
        {
            var dto = await Handle(new GetSalesOrderByIdQuery(order.Id), cancellationToken);
            result.Add(dto);
        }

        return result;
    }
}
