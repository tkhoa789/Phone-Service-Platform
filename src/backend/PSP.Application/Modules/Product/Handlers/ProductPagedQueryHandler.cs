using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Product.DTOs;
using PSP.Application.Modules.Product.Queries;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

public class ProductPagedQueryHandler : IRequestHandler<GetProductsPagedQuery, PagedResult<ProductDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFieldVisibilityService _fieldVisibility;

    public ProductPagedQueryHandler(IUnitOfWork unitOfWork, IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService();
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsPagedQuery request, CancellationToken cancellationToken)
    {
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var query = productRepo.GetQueryableAsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(keyword) || p.Code.ToLower().Contains(keyword));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        if (request.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == request.BrandId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // N+1 mitigation for current page (only up to PageSize records)
        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var brandIds = products.Select(p => p.BrandId).Distinct().ToList();
        var productIds = products.Select(p => p.Id).ToList();

        var categories = await _unitOfWork.Repository<CategoryEntity>()
            .GetQueryableAsNoTracking()
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var brands = await _unitOfWork.Repository<BrandEntity>()
            .GetQueryableAsNoTracking()
            .Where(b => brandIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken);

        var variants = await _unitOfWork.Repository<ProductVariantEntity>()
            .GetQueryableAsNoTracking()
            .Where(v => productIds.Contains(v.ProductId))
            .ToListAsync(cancellationToken);

        var dtos = products.Select(p =>
        {
            var dto = p.Adapt<ProductDto>();
            dto.CategoryName = categories.TryGetValue(p.CategoryId, out var cName) ? cName : "Không xác định";
            dto.BrandName = brands.TryGetValue(p.BrandId, out var bName) ? bName : "Không xác định";
            
            var pVariants = variants.Where(v => v.ProductId == p.Id).ToList();
            dto.Variants = pVariants.Adapt<List<ProductVariantDto>>();
            
            if (pVariants.Any())
            {
                // Extra variant calculations if needed in future, currently none in DTO
            }
            return dto;
        }).ToList();

        _fieldVisibility.MaskProducts(dtos);

        return new PagedResult<ProductDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
