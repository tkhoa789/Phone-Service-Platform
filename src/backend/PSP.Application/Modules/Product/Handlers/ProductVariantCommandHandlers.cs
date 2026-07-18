using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Inventory.Entities; // Chứa các thực thể liên quan đến kho hàng

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho các lệnh Command liên quan đến Biến thể sản phẩm).
/// </summary>
public class ProductVariantCommandHandlers :
    IRequestHandler<CreateProductVariantCommand, Guid>,
    IRequestHandler<UpdateProductVariantCommand, bool>,
    IRequestHandler<DeleteProductVariantCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Hàm khởi tạo inject IUnitOfWork.
    /// </summary>
    public ProductVariantCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới một Biến thể sản phẩm.
    /// </summary>
    public async Task<Guid> Handle(CreateProductVariantCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra dòng sản phẩm cha (Product) có tồn tại trong hệ thống không
        var productRepo = _unitOfWork.Repository<ProductEntity>();
        var product = await productRepo.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException("Dòng sản phẩm cha", request.ProductId);
        }

        // 2. Kiểm tra trùng mã SKU (SKU phải là duy nhất, kể cả đã xóa mềm)
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var existing = await variantRepo.FindFirstIgnoreQueryFiltersAsync(x => x.Sku == request.Sku, cancellationToken);
        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                request.Adapt(existing);
                variantRepo.Update(existing);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return existing.Id;
            }
            throw new ConflictException($"Mã SKU {request.Sku} đã tồn tại trong hệ thống.");
        }

        // 3. Ánh xạ từ Command sang Entity
        var variant = request.Adapt<ProductVariantEntity>();

        // 4. Lưu vào Database
        await variantRepo.AddAsync(variant, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return variant.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin Biến thể sản phẩm.
    /// </summary>
    public async Task<bool> Handle(UpdateProductVariantCommand request, CancellationToken cancellationToken)
    {
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tìm biến thể sản phẩm cần cập nhật
        var variant = await variantRepo.GetByIdAsync(request.Id, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Biến thể sản phẩm", request.Id);
        }

        // 2. Ánh xạ đè thông tin mới vào thực thể cũ 
        // (Lưu ý: Không cho phép sửa ProductId và Sku vì đây là thông tin định danh tĩnh)
        request.Adapt(variant);

        // 3. Cập nhật và Commit
        variantRepo.Update(variant);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa Biến thể sản phẩm (Xóa mềm).
    /// </summary>
    public async Task<bool> Handle(DeleteProductVariantCommand request, CancellationToken cancellationToken)
    {
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Tìm biến thể sản phẩm cần xóa
        var variant = await variantRepo.GetByIdAsync(request.Id, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Biến thể sản phẩm", request.Id);
        }

        // 2. [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU KHO 1]:
        // Kiểm tra xem biến thể này còn hàng tồn kho vật lý tại bất kỳ chi nhánh/kho nào không.
        // Dùng phương thức FindAsync để lọc xem có Warehouse nào chứa mặt hàng tồn kho này với số lượng > 0 hay không.
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var warehousesWithStock = await warehouseRepo.FindAsync(
            w => w.Inventories.Any(inv => inv.ProductVariantId == request.Id && inv.Quantity > 0),
            cancellationToken
        );

        if (warehousesWithStock.Any())
        {
            throw new BadRequestException("Không thể xóa biến thể này vì vẫn còn hàng tồn kho tại các chi nhánh.");
        }

        // 3. [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU KHO 2]:
        // Kiểm tra xem biến thể này có mã định danh IMEI nào đang hoạt động trong kho hay không.
        var warehousesWithImeis = await warehouseRepo.FindAsync(
            w => w.Imeis.Any(i => i.ProductVariantId == request.Id),
            cancellationToken
        );

        if (warehousesWithImeis.Any())
        {
            throw new BadRequestException("Không thể xóa biến thể này vì đang tồn tại danh sách mã số định danh IMEI liên kết.");
        }

        // 4. [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU KHO 3]:
        // Kiểm tra xem biến thể này có nằm trong lịch sử phiếu nhập hàng (PurchaseOrder) nào không.
        var purchaseOrderRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var purchaseOrdersWithVariant = await purchaseOrderRepo.FindAsync(
            po => po.Items.Any(item => item.ProductVariantId == request.Id),
            cancellationToken
        );

        if (purchaseOrdersWithVariant.Any())
        {
            throw new BadRequestException("Không thể xóa biến thể này vì đã có lịch sử chứng từ phiếu nhập hàng.");
        }

        // 5. Nếu vượt qua mọi kiểm tra an toàn -> Thực hiện xóa mềm
        variantRepo.Remove(variant);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
