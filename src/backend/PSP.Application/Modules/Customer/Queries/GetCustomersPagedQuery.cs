using MediatR;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Customer.DTOs;

namespace PSP.Application.Modules.Customer.Queries;

public class GetCustomersPagedQuery : IRequest<PagedResult<CustomerDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public string? Search { get => Keyword; set => Keyword = value; }
}
