using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic truy vấn cho các yêu cầu lấy thông tin Dòng sản phẩm).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Lớp này xử lý việc đọc dữ liệu từ DB cho Dòng sản phẩm.
/// - Để tuân thủ chuẩn Clean Architecture, tầng Application không phụ thuộc trực tiếp vào Entity Framework Core (không sử dụng Microsoft.EntityFrameworkCore).
/// - Do đó, thay vì dùng các hàm `.Include()` hay `.ToListAsync()` của EF Core, chúng ta sử dụng các API thiết kế sẵn trên `IRepository` như `GetByIdAsNoTrackingAsync` và `FindAsync` để nạp dữ liệu liên quan một cách độc lập, sau đó ghép nối chúng lại bằng LINQ thông thường.
/// </summary>
public class ProductQueryHandlers :
    IRequestHandler<GetProductByIdQuery, ProductDto>,
    IRequestHandler<GetAllProductsQuery, IEnumerable<ProductDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFieldVisibilityService _fieldVisibility;

    /// <summary>
    /// Hàm khởi tạo, nhận vào IUnitOfWork để truy cập các Repo.
    /// </summary>
    public ProductQueryHandlers(IUnitOfWork unitOfWork, IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService();
    }

    /// <summary>
    /// Xử lý truy vấn lấy chi tiết dòng sản phẩm theo Id.
    /// </summary>
    public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải thông tin dòng sản phẩm chính
        var product = await productRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException("Dòng sản phẩm", request.Id);
        }

        // 2. Tải thông tin danh mục liên kết
        var category = await categoryRepo.GetByIdAsNoTrackingAsync(product.CategoryId, cancellationToken);
        
        // 3. Tải thông tin thương hiệu liên kết
        var brand = await brandRepo.GetByIdAsNoTrackingAsync(product.BrandId, cancellationToken);

        // 4. Tải danh sách biến thể thuộc dòng sản phẩm này
        var variants = await variantRepo.FindAsync(v => v.ProductId == product.Id, cancellationToken);

        // 5. Ánh xạ dòng máy chính sang DTO
        var dto = product.Adapt<ProductDto>();
        dto.CategoryName = category?.Name ?? "Không xác định";
        dto.BrandName = brand?.Name ?? "Không xác định";

        // 6. Ánh xạ danh sách các biến thể con sang DTO và gán ngược tên sản phẩm cha
        var variantDtos = variants.Select(v => {
            var vDto = v.Adapt<ProductVariantDto>();
            vDto.ProductName = product.Name;
            return vDto;
        }).ToList();

        dto.Variants = variantDtos;
        _fieldVisibility.MaskProduct(dto);

        return dto;
    }

    /// <summary>
    /// Xử lý truy vấn lấy tất cả dòng sản phẩm đang hoạt động.
    /// </summary>
    public async Task<IEnumerable<ProductDto>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tải toàn bộ dòng máy, danh mục, thương hiệu và biến thể đang hoạt động về bộ nhớ RAM để ghép nối.
        // Cách làm này tối ưu hiệu năng khi số lượng bản ghi danh mục và thương hiệu không quá lớn, tránh việc truy vấn SQL lặp (lỗi N+1).
        var products = (await productRepo.GetAllAsNoTrackingAsync(cancellationToken)).ToList();
        var categories = (await categoryRepo.GetAllAsNoTrackingAsync(cancellationToken)).ToList();
        var brands = (await brandRepo.GetAllAsNoTrackingAsync(cancellationToken)).ToList();
        var variants = (await variantRepo.GetAllAsNoTrackingAsync(cancellationToken)).ToList();

        // 2. Ghép nối dữ liệu trong bộ nhớ bằng LINQ
        var dtos = products.Select(p => {
            var dto = p.Adapt<ProductDto>();
            
            // Tìm tên danh mục và hãng thương hiệu tương ứng
            dto.CategoryName = categories.FirstOrDefault(c => c.Id == p.CategoryId)?.Name ?? "Không xác định";
            dto.BrandName = brands.FirstOrDefault(b => b.Id == p.BrandId)?.Name ?? "Không xác định";

            // Lọc các biến thể thuộc dòng sản phẩm này và gán tên dòng máy cha
            dto.Variants = variants
                .Where(v => v.ProductId == p.Id)
                .Select(v => {
                    var vDto = v.Adapt<ProductVariantDto>();
                    vDto.ProductName = p.Name;
                    return vDto;
                }).ToList();

            return dto;
        }).ToList();

        _fieldVisibility.MaskProducts(dtos);

        return dtos;
    }
}
