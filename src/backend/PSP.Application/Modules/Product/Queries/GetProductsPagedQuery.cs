using MediatR;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Modules.Product.Queries;

public class GetProductsPagedQuery : IRequest<PagedResult<ProductDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public string? Search { get => Keyword; set => Keyword = value; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
}
