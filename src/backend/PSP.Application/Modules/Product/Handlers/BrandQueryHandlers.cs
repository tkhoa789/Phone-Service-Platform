using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho các câu truy vấn QUERY)
/// Lớp này xử lý các yêu cầu lấy dữ liệu liên quan đến Thương hiệu:
/// 1. Lấy chi tiết thương hiệu theo Id (GetBrandByIdQuery)
/// 2. Lấy toàn bộ danh sách thương hiệu (GetAllBrandsQuery)
/// 
/// Sử dụng AsNoTracking để tối ưu hiệu năng đọc từ DB (tránh EF Core lưu vết tracking không cần thiết).
/// </summary>
public class BrandQueryHandlers :
    IRequestHandler<GetBrandByIdQuery, BrandDto>,
    IRequestHandler<GetAllBrandsQuery, IEnumerable<BrandDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Inject IUnitOfWork thông qua Constructor.
    /// </summary>
    public BrandQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý lấy thông tin chi tiết một Thương hiệu.
    /// </summary>
    public async Task<BrandDto> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        
        // Truy vấn thương hiệu theo Id với AsNoTracking (không tracking để tăng hiệu năng đọc)
        var brand = await brandRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            // Quăng lỗi NotFound nếu không tìm thấy
            throw new NotFoundException("Thương hiệu", request.Id);
        }

        // Ánh xạ thực thể (Entity) sang DTO trước khi trả về
        return brand.Adapt<BrandDto>();
    }

    /// <summary>
    /// Xử lý lấy toàn bộ danh sách Thương hiệu đang hoạt động.
    /// </summary>
    public async Task<IEnumerable<BrandDto>> Handle(GetAllBrandsQuery request, CancellationToken cancellationToken)
    {
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        
        // Lấy tất cả thương hiệu chưa bị xóa mềm từ database
        var brands = await brandRepo.GetAllAsNoTrackingAsync(cancellationToken);
        
        // Ánh xạ danh sách các thực thể thành danh sách DTOs
        return brands.Adapt<IEnumerable<BrandDto>>();
    }
}

