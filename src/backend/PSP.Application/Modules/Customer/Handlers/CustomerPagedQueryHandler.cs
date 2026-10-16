using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Customer.Queries;
using PSP.Domain.Modules.Customer.Entities;

namespace PSP.Application.Modules.Customer.Handlers;

public class CustomerPagedQueryHandler : IRequestHandler<GetCustomersPagedQuery, PagedResult<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFieldVisibilityService _fieldVisibility;

    public CustomerPagedQueryHandler(IUnitOfWork unitOfWork, IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService();
    }

    public async Task<PagedResult<CustomerDto>> Handle(GetCustomersPagedQuery request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();
        var query = repo.GetQueryableAsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(keyword) || 
                                     c.Phone.Contains(keyword) || 
                                     c.Code.ToLower().Contains(keyword));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var customers = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = customers.Adapt<List<CustomerDto>>();
        _fieldVisibility.MaskCustomers(dtos);

        return new PagedResult<CustomerDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
