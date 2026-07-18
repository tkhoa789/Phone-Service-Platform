using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho danh mục sản phẩm)
/// Chịu trách nhiệm thực thi các logic tạo, cập nhật, xóa danh mục sản phẩm.
/// Có các kiểm tra ràng buộc phức tạp như: danh mục trùng mã, vòng lặp cây danh mục (circular dependency), và kiểm tra trước khi xóa.
/// </summary>
public class CategoryCommandHandlers :
    IRequestHandler<CreateCategoryCommand, Guid>,
    IRequestHandler<UpdateCategoryCommand, bool>,
    IRequestHandler<DeleteCategoryCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Khởi tạo và inject IUnitOfWork vào Handler.
    /// </summary>
    public CategoryCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý Tạo mới Danh mục.
    /// </summary>
    public async Task<Guid> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();

        // 1. Kiểm tra trùng mã danh mục (Code phải là duy nhất, kể cả đã xóa mềm)
        var existing = await categoryRepo.FindFirstIgnoreQueryFiltersAsync(x => x.Code == request.Code, cancellationToken);
        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                request.Adapt(existing);
                categoryRepo.Update(existing);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return existing.Id;
            }
            throw new ConflictException($"Danh mục với mã {request.Code} đã tồn tại.");
        }

        // 2. Kiểm tra tính hợp lệ của Danh mục cha (nếu có cung cấp ParentId)
        if (request.ParentId.HasValue)
        {
            var parent = await categoryRepo.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
            {
                // Trả về lỗi NotFound nếu danh mục cha không tồn tại thực tế
                throw new NotFoundException("Danh mục cha", request.ParentId.Value);
            }
        }

        // 3. Thực hiện ánh xạ dữ liệu và lưu xuống Database
        var category = request.Adapt<CategoryEntity>();
        await categoryRepo.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return category.Id;
    }

    /// <summary>
    /// Xử lý Cập nhật Danh mục.
    /// </summary>
    public async Task<bool> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        
        // 1. Tìm danh mục cần cập nhật
        var category = await categoryRepo.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Danh mục", request.Id);
        }

        // 2. Xử lý kiểm tra nếu cập nhật danh mục cha (ParentId)
        if (request.ParentId.HasValue)
        {
            // RÀN BUỘC 2.1: Không được chọn chính nó làm cha của nó
            if (request.ParentId.Value == request.Id)
            {
                throw new BadRequestException("Không thể chọn chính danh mục này làm danh mục cha.");
            }

            // RÀN BUỘC 2.2: Danh mục cha được gán phải tồn tại trong hệ thống
            var parent = await categoryRepo.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
            {
                throw new NotFoundException("Danh mục cha", request.ParentId.Value);
            }

            // RÀN BUỘC 2.3: Tránh lỗi vòng lặp cây danh mục (Circular Dependency)
            // Ví dụ: Không được thiết lập danh mục A là con của danh mục B, trong khi B lại đang là con của A.
            // Giải thuật: Duyệt ngược lên từ danh mục cha mới, kiểm tra xem có node nào trùng với danh mục hiện tại (request.Id) không.
            var currentParentId = request.ParentId;
            while (currentParentId.HasValue)
            {
                if (currentParentId.Value == request.Id)
                {
                    throw new BadRequestException("Không thể chọn danh mục con làm danh mục cha (Lỗi vòng lặp cây danh mục).");
                }
                // Lấy thông tin node cha tiếp theo (AsNoTracking để tối ưu tài nguyên hệ thống)
                var parentNode = await categoryRepo.GetByIdAsNoTrackingAsync(currentParentId.Value, cancellationToken);
                currentParentId = parentNode?.ParentId;
            }
        }

        // 3. Thực hiện cập nhật
        request.Adapt(category);
        categoryRepo.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý Xóa Danh mục (Xóa mềm).
    /// </summary>
    public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        
        // 1. Tìm danh mục cần xóa
        var category = await categoryRepo.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Danh mục", request.Id);
        }

        // RÀN BUỘC CỨNG 2: Không được xóa danh mục nếu đang có các danh mục con phụ thuộc vào nó.
        var hasChildren = (await categoryRepo.FindAsync(x => x.ParentId == request.Id, cancellationToken)).Any();
        if (hasChildren)
        {
            throw new BadRequestException("Không thể xóa danh mục này vì nó chứa các danh mục con.");
        }

        // RÀN BUỘC CỨNG 3: Không được xóa danh mục nếu đang có sản phẩm thuộc danh mục này.
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var hasProducts = (await productRepo.FindAsync(x => x.CategoryId == request.Id, cancellationToken)).Any();
        if (hasProducts)
        {
            throw new BadRequestException("Không thể xóa danh mục này vì đang có sản phẩm thuộc danh mục này.");
        }

        // 3. Tiến hành xóa mềm và lưu DB
        categoryRepo.Remove(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

