using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic truy vấn danh mục sản phẩm)
/// Chịu trách nhiệm lấy dữ liệu danh mục từ Database và trả về định dạng DTO cho Client.
/// Cần xử lý điền thủ công tên của Danh mục cha (ParentName) dựa vào ParentId.
/// </summary>
public class CategoryQueryHandlers :
    IRequestHandler<GetCategoryByIdQuery, CategoryDto>,
    IRequestHandler<GetAllCategoriesQuery, IEnumerable<CategoryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Inject IUnitOfWork thông qua Constructor.
    /// </summary>
    public CategoryQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý lấy thông tin chi tiết của một Danh mục theo ID.
    /// </summary>
    public async Task<CategoryDto> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        
        // 1. Tải danh mục cần truy vấn lên từ DB (không tracking để tăng hiệu năng)
        var category = await categoryRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Danh mục", request.Id);
        }

        // 2. Tìm tên danh mục cha nếu danh mục này có ParentId
        string? parentName = null;
        if (category.ParentId.HasValue)
        {
            var parent = await categoryRepo.GetByIdAsNoTrackingAsync(category.ParentId.Value, cancellationToken);
            parentName = parent?.Name;
        }

        // 3. Ánh xạ thực thể sang DTO và gán thông tin tên danh mục cha
        var dto = category.Adapt<CategoryDto>();
        dto.ParentName = parentName;
        return dto;
    }

    /// <summary>
    /// Xử lý lấy toàn bộ danh sách Danh mục sản phẩm (Chưa bị xóa mềm).
    /// </summary>
    public async Task<IEnumerable<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        
        // 1. Lấy toàn bộ danh mục lên từ DB
        var categories = (await categoryRepo.GetAllAsNoTrackingAsync(cancellationToken)).ToList();

        // 2. Ánh xạ danh sách thực thể sang DTO và điền ParentName cho từng danh mục dựa trên danh sách đã tải
        // (Cách làm này giúp tránh việc gửi thêm N câu lệnh SQL để truy vấn tên cha, tối ưu hiệu năng)
        return categories.Select(c =>
        {
            var dto = c.Adapt<CategoryDto>();
            dto.ParentName = c.ParentId.HasValue 
                ? categories.FirstOrDefault(p => p.Id == c.ParentId.Value)?.Name 
                : null;
            return dto;
        });
    }
}

