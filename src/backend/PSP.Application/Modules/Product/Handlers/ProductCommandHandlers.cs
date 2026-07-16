using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho các lệnh Command liên quan đến Dòng sản phẩm).
/// </summary>
public class ProductCommandHandlers :
    IRequestHandler<CreateProductCommand, Guid>,
    IRequestHandler<UpdateProductCommand, bool>,
    IRequestHandler<DeleteProductCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Hàm khởi tạo, inject IUnitOfWork để quản lý Repo và Transaction.
    /// </summary>
    public ProductCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý Tạo mới dòng sản phẩm.
    /// </summary>
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra nhóm danh mục (Category) có tồn tại và đang hoạt động không
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        var category = await categoryRepo.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Danh mục sản phẩm", request.CategoryId);
        }

        // 2. Kiểm tra hãng thương hiệu (Brand) có tồn tại không
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        var brand = await brandRepo.GetByIdAsync(request.BrandId, cancellationToken);
        if (brand == null)
        {
            throw new NotFoundException("Thương hiệu sản phẩm", request.BrandId);
        }

        // 3. Kiểm tra xem mã dòng sản phẩm (Code) đã tồn tại trong DB chưa (Code là duy nhất)
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var existing = await productRepo.FindAsync(x => x.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Dòng sản phẩm với mã {request.Code} đã tồn tại trong hệ thống.");
        }

        // 4. Ánh xạ dữ liệu từ Command sang Entity thực tế của DB
        var product = request.Adapt<ProductEntity>();

        // 5. Lưu vào Repository và Commit thay đổi xuống SQL Server
        await productRepo.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Trả về Id Guid vừa được tạo
        return product.Id;
    }

    /// <summary>
    /// Xử lý Cập nhật thông tin dòng sản phẩm.
    /// </summary>
    public async Task<bool> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var productRepo = _unitOfWork.Repository<ProductEntity>();

        // 1. Kiểm tra dòng sản phẩm cần cập nhật có tồn tại không
        var product = await productRepo.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException("Dòng sản phẩm", request.Id);
        }

        // 2. Kiểm tra danh mục mới có tồn tại không
        var categoryRepo = _unitOfWork.Repository<CategoryEntity>();
        var category = await categoryRepo.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Danh mục sản phẩm", request.CategoryId);
        }

        // 3. Kiểm tra thương hiệu mới có tồn tại không
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        var brand = await brandRepo.GetByIdAsync(request.BrandId, cancellationToken);
        if (brand == null)
        {
            throw new NotFoundException("Thương hiệu sản phẩm", request.BrandId);
        }

        // 4. Ánh xạ đè dữ liệu mới từ Command sang Entity
        request.Adapt(product);

        // 5. Cập nhật Entity và Save
        productRepo.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý Xóa dòng sản phẩm (Xóa mềm).
    /// </summary>
    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var productRepo = _unitOfWork.Repository<ProductEntity>();

        // 1. Kiểm tra xem sản phẩm cần xóa có tồn tại không
        var product = await productRepo.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException("Dòng sản phẩm", request.Id);
        }

        // 2. [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU]:
        // Không cho phép xóa dòng sản phẩm cha nếu dòng máy đó đang có các biến thể con (ProductVariant) hoạt động.
        // Phải xóa hết các biến thể con trước rồi mới được phép xóa dòng sản phẩm cha.
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var hasVariants = (await variantRepo.FindAsync(x => x.ProductId == request.Id, cancellationToken)).Any();
        if (hasVariants)
        {
            throw new BadRequestException("Không thể xóa dòng sản phẩm này vì vẫn còn các biến thể con liên kết hoạt động.");
        }

        // 3. Xóa mềm (Repo sẽ cập nhật cờ IsDeleted = true)
        productRepo.Remove(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
