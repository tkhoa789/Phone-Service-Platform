using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic truy vấn cho các yêu cầu lấy thông tin Biến thể sản phẩm).
/// </summary>
public class ProductVariantQueryHandlers :
    IRequestHandler<GetProductVariantByIdQuery, ProductVariantDto>,
    IRequestHandler<GetProductVariantsByProductIdQuery, IEnumerable<ProductVariantDto>>,
    IRequestHandler<GetAllProductVariantsQuery, IEnumerable<ProductVariantDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFieldVisibilityService _fieldVisibility;

    /// <summary>
    /// Constructor inject IUnitOfWork.
    /// </summary>
    public ProductVariantQueryHandlers(IUnitOfWork unitOfWork, IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService();
    }

    /// <summary>
    /// Xử lý lấy chi tiết một biến thể sản phẩm theo Id.
    /// </summary>
    public async Task<ProductVariantDto> Handle(GetProductVariantByIdQuery request, CancellationToken cancellationToken)
    {
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var productRepo = _unitOfWork.Repository<ProductEntity>();

        // 1. Tải bản ghi biến thể lên
        var variant = await variantRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Biến thể sản phẩm", request.Id);
        }

        // 2. Tải dòng máy cha tương ứng để lấy tên sản phẩm
        var product = await productRepo.GetByIdAsNoTrackingAsync(variant.ProductId, cancellationToken);

        // 3. Ánh xạ và trả về
        var dto = variant.Adapt<ProductVariantDto>();
        dto.ProductName = product?.Name ?? "Không xác định";
        _fieldVisibility.MaskProductVariant(dto);

        return dto;
    }

    /// <summary>
    /// Xử lý lấy danh sách biến thể sản phẩm theo Id dòng máy cha (ProductId).
    /// </summary>
    public async Task<IEnumerable<ProductVariantDto>> Handle(GetProductVariantsByProductIdQuery request, CancellationToken cancellationToken)
    {
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var productRepo = _unitOfWork.Repository<ProductEntity>();

        // 1. Kiểm tra dòng sản phẩm cha có tồn tại không
        var product = await productRepo.GetByIdAsNoTrackingAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException("Dòng sản phẩm cha", request.ProductId);
        }

        // 2. Tìm danh sách các biến thể thuộc ProductId này
        var variants = await variantRepo.FindAsync(v => v.ProductId == request.ProductId, cancellationToken);

        // 3. Ánh xạ danh sách DTO
        var dtos = variants.Select(v => {
            var dto = v.Adapt<ProductVariantDto>();
            dto.ProductName = product.Name;
            return dto;
        }).ToList();

        _fieldVisibility.MaskProductVariants(dtos);

        return dtos;
    }

    /// <summary>
    /// Xử lý lấy tất cả biến thể sản phẩm đang hoạt động trên hệ thống.
    /// </summary>
    public async Task<IEnumerable<ProductVariantDto>> Handle(GetAllProductVariantsQuery request, CancellationToken cancellationToken)
    {
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var productRepo = _unitOfWork.Repository<ProductEntity>();

        // 1. Tải toàn bộ biến thể và dòng máy cha về bộ nhớ
        var variants = await variantRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var products = await productRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // 2. Ghép tên sản phẩm cha và trả về danh sách DTOs
        var dtos = variants.Select(v => {
            var dto = v.Adapt<ProductVariantDto>();
            dto.ProductName = products.FirstOrDefault(p => p.Id == v.ProductId)?.Name ?? "Không xác định";
            return dto;
        }).ToList();

        _fieldVisibility.MaskProductVariants(dtos);

        return dtos;
    }
}
