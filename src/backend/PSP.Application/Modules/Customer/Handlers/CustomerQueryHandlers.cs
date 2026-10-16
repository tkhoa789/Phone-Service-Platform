using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Customer.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Customer.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu truy vấn thông tin Khách hàng (GetById, GetByPhone, GetList/Search).
/// </summary>
public class CustomerQueryHandlers :
    IRequestHandler<GetCustomerByIdQuery, CustomerDto>,
    IRequestHandler<GetCustomerByPhoneQuery, CustomerDto>,
    IRequestHandler<GetCustomersQuery, IEnumerable<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFieldVisibilityService _fieldVisibility;

    public CustomerQueryHandlers(IUnitOfWork unitOfWork, IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService();
    }

    /// <summary>
    /// Lấy chi tiết hồ sơ Khách hàng theo ID khóa chính.
    /// </summary>
    public async Task<CustomerDto> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();
        var customer = await repo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.Id);
        }

        var dto = customer.Adapt<CustomerDto>();
        _fieldVisibility.MaskCustomer(dto);
        return dto;
    }

    /// <summary>
    /// Tra cứu thông tin Khách hàng theo số điện thoại (BR-301).
    /// </summary>
    public async Task<CustomerDto> Handle(GetCustomerByPhoneQuery request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();
        var existing = await repo.FindAsNoTrackingAsync(c => c.Phone == request.Phone, cancellationToken);
        var customer = existing.FirstOrDefault();
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng với số điện thoại", request.Phone);
        }

        var dto = customer.Adapt<CustomerDto>();
        _fieldVisibility.MaskCustomer(dto);
        return dto;
    }

    /// <summary>
    /// Lấy danh sách Khách hàng kèm bộ lọc tìm kiếm tương tác.
    /// </summary>
    public async Task<IEnumerable<CustomerDto>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();
        
        // 1. Tải danh sách khách hàng không theo dõi lên RAM
        var list = await repo.GetAllAsNoTrackingAsync(cancellationToken);

        // 2. Lọc thông tin theo từ khóa (họ tên hoặc số điện thoại) trên RAM
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var cleanKeyword = request.Keyword.Trim().ToLower();
            list = list.Where(c => 
                c.FullName.ToLower().Contains(cleanKeyword) || 
                c.Phone.Contains(cleanKeyword)
            );
        }

        var dtos = list.Select(c => c.Adapt<CustomerDto>()).ToList();
        _fieldVisibility.MaskCustomers(dtos);
        return dtos;
    }
}
