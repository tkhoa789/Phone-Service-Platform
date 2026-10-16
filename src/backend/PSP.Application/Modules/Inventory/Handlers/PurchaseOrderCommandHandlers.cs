using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Inventory.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu thay đổi dữ liệu của Phiếu nhập kho (Create, Update, Complete, Cancel, Delete).
/// </summary>
public class PurchaseOrderCommandHandlers :
    IRequestHandler<CreatePurchaseOrderCommand, Guid>,
    IRequestHandler<UpdatePurchaseOrderCommand, bool>,
    IRequestHandler<CompletePurchaseOrderCommand, bool>,
    IRequestHandler<CancelPurchaseOrderCommand, bool>,
    IRequestHandler<DeletePurchaseOrderCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IScopeContextService _scopeContext;

    public PurchaseOrderCommandHandlers(IUnitOfWork unitOfWork, IIdempotencyService idempotencyService, IScopeContextService? scopeContext = null)
    {
        _unitOfWork = unitOfWork;
        _idempotencyService = idempotencyService;
        _scopeContext = scopeContext ?? new ScopeContextService();
    }

    /// <summary>
    /// Xử lý tạo mới Phiếu nhập kho (mặc định trạng thái là Draft).
    /// </summary>
    public async Task<Guid> Handle(CreatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra sự tồn tại của Nhà cung cấp
        var supplier = await _unitOfWork.Repository<SupplierEntity>().GetByIdAsync(request.SupplierId, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.SupplierId);
        }

        // 2. Kiểm tra sự tồn tại của Kho hàng nhận
        var warehouse = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.WarehouseId);
        }
        _scopeContext.ValidateBranchAccess(warehouse.BranchId, "kho hàng nhận");

        // 3. Kiểm tra tính duy nhất của Mã phiếu nhập kho (Code)
        var existing = await _unitOfWork.Repository<PurchaseOrderEntity>().FindAsync(po => po.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Mã phiếu nhập kho '{request.Code}' đã tồn tại trong hệ thống.");
        }

        // 4. Tạo thực thể phiếu nhập kho chính
        var po = new PurchaseOrderEntity
        {
            SupplierId = request.SupplierId,
            WarehouseId = request.WarehouseId,
            Code = request.Code,
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = request.Items.Sum(i => i.Quantity * i.UnitPrice)
        };

        await _unitOfWork.Repository<PurchaseOrderEntity>().AddAsync(po, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken); // Save trước để lấy ID phiếu nhập kho làm khóa ngoại cho các Items

        // 5. Tạo các dòng chi tiết mặt hàng
        foreach (var itemDto in request.Items)
        {
            // Kiểm tra xem biến thể sản phẩm nhập vào có tồn tại không
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            var item = new PurchaseOrderItemEntity
            {
                PurchaseOrderId = po.Id,
                ProductVariantId = itemDto.ProductVariantId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice
            };
            await _unitOfWork.Repository<PurchaseOrderItemEntity>().AddAsync(item, cancellationToken);
        }

        _idempotencyService.AttachRecord(po.Id);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return po.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin phiếu nhập kho (Chỉ được phép chỉnh sửa khi ở trạng thái Draft).
    /// </summary>
    public async Task<bool> Handle(UpdatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var itemRepo = _unitOfWork.Repository<PurchaseOrderItemEntity>();

        // 1. Tìm phiếu nhập kho cần sửa
        var po = await poRepo.GetByIdAsync(request.Id, cancellationToken);
        if (po == null)
        {
            throw new NotFoundException("Phiếu nhập kho", request.Id);
        }

        await ValidatePurchaseOrderAccessAsync(po, cancellationToken);

        if (request.RowVersion == null || !po.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin phiếu nhập kho đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        // 2. Ràng buộc: Chỉ được sửa khi đang ở trạng thái Nháp (Draft)
        if (po.Status != PurchaseOrderStatus.Draft)
        {
            throw new ConflictException("Chỉ có thể cập nhật phiếu nhập ở trạng thái Nháp (Draft).");
        }

        // 3. Kiểm tra nhà cung cấp và kho hàng
        var supplier = await _unitOfWork.Repository<SupplierEntity>().GetByIdAsync(request.SupplierId, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.SupplierId);
        }

        var warehouse = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.WarehouseId);
        }
        _scopeContext.ValidateBranchAccess(warehouse.BranchId, "kho hàng nhận");

        // 4. Xóa sạch các chi tiết mặt hàng cũ (thực hiện xóa mềm)
        var oldItems = await itemRepo.FindAsync(i => i.PurchaseOrderId == po.Id, cancellationToken);
        foreach (var oldItem in oldItems)
        {
            itemRepo.Remove(oldItem);
        }

        // 5. Thêm mới các dòng chi tiết mặt hàng và tính toán lại tổng tiền
        decimal totalAmount = 0;
        foreach (var itemDto in request.Items)
        {
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            var item = new PurchaseOrderItemEntity
            {
                PurchaseOrderId = po.Id,
                ProductVariantId = itemDto.ProductVariantId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice
            };
            totalAmount += itemDto.Quantity * itemDto.UnitPrice;
            await itemRepo.AddAsync(item, cancellationToken);
        }

        // 6. Cập nhật thuộc tính của phiếu nhập kho chính
        po.SupplierId = request.SupplierId;
        po.WarehouseId = request.WarehouseId;
        po.TotalAmount = totalAmount;
        poRepo.Update(po);

        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu phiếu nhập đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    /// <summary>
    /// Xử lý hoàn tất phiếu nhập (Received): cập nhật số lượng tồn kho khả dụng và gieo IMEI thiết bị.
    /// </summary>
    public async Task<bool> Handle(CompletePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var itemRepo = _unitOfWork.Repository<PurchaseOrderItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        var debtTransactionRepo = _unitOfWork.Repository<SupplierDebtTransactionEntity>();

        // 1. Tìm phiếu nhập
        var po = await poRepo.GetByIdAsync(request.Id, cancellationToken);
        if (po == null)
        {
            throw new NotFoundException("Phiếu nhập kho", request.Id);
        }

        await ValidatePurchaseOrderAccessAsync(po, cancellationToken);

        if (request.RowVersion == null || !po.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin phiếu nhập kho đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        // 2. Kiểm tra trạng thái hợp lệ
        if (po.Status != PurchaseOrderStatus.Draft && po.Status != PurchaseOrderStatus.Confirmed)
        {
            throw new ConflictException("Phiếu nhập đã nhận hàng hoặc đã hủy, không thể thay đổi trạng thái nữa.");
        }

        // Kiểm tra tính duy nhất của tất cả các mã IMEI truyền lên trong toàn bộ phiếu
        var allSuppliedImeis = request.VariantImeis.SelectMany(x => x.Imeis).Select(i => i.Trim()).ToList();
        if (allSuppliedImeis.Count != allSuppliedImeis.Distinct(StringComparer.OrdinalIgnoreCase).Count())
        {
            throw new BadRequestException("Danh sách mã IMEI nhập vào trong phiếu bị trùng lặp.");
        }

        // 3. Lấy tất cả các chi tiết mặt hàng cần nhập
        var items = await itemRepo.FindAsync(i => i.PurchaseOrderId == po.Id, cancellationToken);

        // 4. Xử lý tồn kho và IMEI cho từng mặt hàng
        foreach (var item in items)
        {
            // Kiểm tra mặt hàng đó có yêu cầu quản lý theo IMEI hay không (nếu là Điện thoại thuộc danh mục MOBILE)
            var isImeiRequired = await IsImeiControlledAsync(item.ProductVariantId, cancellationToken);

            if (isImeiRequired)
            {
                // Tìm danh sách IMEI truyền lên tương ứng với VariantId này
                var supplied = request.VariantImeis.FirstOrDefault(x => x.ProductVariantId == item.ProductVariantId);
                var imeisList = supplied?.Imeis ?? new List<string>();

                // Ràng buộc số lượng IMEI nhập vào phải bằng số lượng hàng nhận thực tế
                if (imeisList.Count != item.Quantity)
                {
                    throw new BadRequestException($"Mặt hàng với ID biến thể '{item.ProductVariantId}' yêu cầu đúng {item.Quantity} mã IMEI, nhưng bạn chỉ cung cấp {imeisList.Count} mã.");
                }

                // Kiểm tra trùng lặp mã IMEI trên hệ thống (mỗi IMEI chỉ tồn tại duy nhất một lần toàn hệ thống)
                foreach (var imei in imeisList)
                {
                    var cleanImei = imei.Trim();
                    var isImeiTaken = await _unitOfWork.Repository<ImeiEntity>().FindAsync(i => i.Imei == cleanImei, cancellationToken);
                    if (isImeiTaken.Any())
                    {
                        throw new ConflictException($"Mã IMEI '{cleanImei}' đã tồn tại trên hệ thống.");
                    }

                    // Thêm thực thể IMEI mới trực tiếp vào cơ sở dữ liệu (BR-505)
                    var newImei = new ImeiEntity
                    {
                        Imei = cleanImei,
                        ProductVariantId = item.ProductVariantId,
                        WarehouseId = po.WarehouseId,
                        Status = ImeiStatus.InStock,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<ImeiEntity>().AddAsync(newImei, cancellationToken);
                }
            }

            // 5. Cộng số lượng vào Tồn kho chi tiết (InventoryEntity)
            var existingInventory = await inventoryRepo.FindAsync(
                inv => inv.WarehouseId == po.WarehouseId && inv.ProductVariantId == item.ProductVariantId,
                cancellationToken
            );
            
            var inventory = existingInventory.FirstOrDefault();
            if (inventory == null)
            {
                // Tạo mới nếu chưa có bản ghi tồn kho
                inventory = new InventoryEntity
                {
                    WarehouseId = po.WarehouseId,
                    ProductVariantId = item.ProductVariantId,
                    Quantity = item.Quantity,
                    MinimumStock = 5 // Mặc định ngưỡng tồn kho tối thiểu
                };
                await inventoryRepo.AddAsync(inventory, cancellationToken);
            }
            else
            {
                // Cộng dồn nếu đã có bản ghi
                inventory.Quantity += item.Quantity;
                inventoryRepo.Update(inventory);
            }

            // Ghi nhận lịch sử giao dịch tồn kho (Thẻ kho)
            var invTxn = new InventoryTransactionEntity
            {
                WarehouseId = po.WarehouseId,
                ProductVariantId = item.ProductVariantId,
                Type = InventoryTransactionType.IMPORT,
                QuantityChange = item.Quantity,
                CostSnapshot = item.UnitPrice,
                ReferenceId = po.Id,
                ActorId = Guid.Empty // Hoặc lấy từ UserInfo nếu có
            };
            await transactionRepo.AddAsync(invTxn, cancellationToken);
        }

        // 6. Cập nhật trạng thái phiếu nhập sang Đã nhận hàng (Received)
        po.Status = PurchaseOrderStatus.Received;
        poRepo.Update(po);

        // 7. Cập nhật công nợ nhà cung cấp
        var supplier = await supplierRepo.GetByIdAsync(po.SupplierId, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", po.SupplierId);
        }

        supplier.DebtAmount += po.TotalAmount;
        supplierRepo.Update(supplier);

        // 8. Ghi nhận sổ công nợ nhà cung cấp
        var debtTxn = new SupplierDebtTransactionEntity
        {
            SupplierId = po.SupplierId,
            TransactionType = "INVOICE",
            Amount = po.TotalAmount,
            BalanceAfter = supplier.DebtAmount,
            ReferenceNo = po.Code,
            Note = $"Nhập hàng theo PO: {po.Code}"
        };
        await debtTransactionRepo.AddAsync(debtTxn, cancellationToken);

        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu phiếu nhập hoặc công nợ đã bị thay đổi bởi giao dịch khác. Vui lòng thử lại.");
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("IX_Imeis_Imei") == true)
                throw new ConflictException("Mã IMEI đã bị trùng lặp.");
            throw;
        }

        return true;
    }

    /// <summary>
    /// Xử lý hủy phiếu nhập kho (Draft/Confirmed -> Cancelled).
    /// </summary>
    public async Task<bool> Handle(CancelPurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var po = await poRepo.GetByIdAsync(request.Id, cancellationToken);
        if (po == null)
        {
            throw new NotFoundException("Phiếu nhập kho", request.Id);
        }

        await ValidatePurchaseOrderAccessAsync(po, cancellationToken);

        if (request.RowVersion == null || !po.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin phiếu nhập kho đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        if (po.Status != PurchaseOrderStatus.Draft && po.Status != PurchaseOrderStatus.Confirmed)
        {
            throw new ConflictException("Phiếu nhập đã nhận hàng hoặc đã hủy, không thể thay đổi trạng thái nữa.");
        }

        po.Status = PurchaseOrderStatus.Cancelled;
        poRepo.Update(po);
        
        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu phiếu nhập đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm Phiếu nhập kho (Chỉ áp dụng khi ở trạng thái Draft).
    /// </summary>
    public async Task<bool> Handle(DeletePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var poRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var po = await poRepo.GetByIdAsync(request.Id, cancellationToken);
        if (po == null)
        {
            throw new NotFoundException("Phiếu nhập kho", request.Id);
        }

        await ValidatePurchaseOrderAccessAsync(po, cancellationToken);

        if (request.RowVersion == null || !po.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin phiếu nhập kho đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
        }

        if (po.Status != PurchaseOrderStatus.Draft)
        {
            throw new ConflictException("Chỉ được phép xóa phiếu nhập ở trạng thái Nháp (Draft).");
        }

        poRepo.Remove(po);
        
        try
        {
            _idempotencyService.AttachRecord(true);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu phiếu nhập đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    private async Task ValidatePurchaseOrderAccessAsync(PurchaseOrderEntity po, CancellationToken cancellationToken)
    {
        await _scopeContext.ValidateWarehouseAccessAsync(_unitOfWork, po.WarehouseId, "phiếu nhập kho", cancellationToken);
    }

    /// <summary>
    /// HÀM TRỢ GIÚP: Xác định xem biến thể sản phẩm có bắt buộc quản lý theo IMEI hay không.
    /// Dựa trên mã danh mục Code = "MOBILE" hoặc danh mục cha của nó có Code = "MOBILE".
    /// </summary>
    private async Task<bool> IsImeiControlledAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsNoTrackingAsync(productVariantId, cancellationToken);
        if (variant == null) return false;

        var product = await _unitOfWork.Repository<ProductEntity>().GetByIdAsNoTrackingAsync(variant.ProductId, cancellationToken);
        if (product == null) return false;

        var category = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(product.CategoryId, cancellationToken);
        if (category == null) return false;

        // Nếu mã danh mục trực tiếp là MOBILE
        if (category.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase)) return true;

        // Nếu mã danh mục cha là MOBILE
        if (category.ParentId.HasValue)
        {
            var parentCategory = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(category.ParentId.Value, cancellationToken);
            if (parentCategory != null && parentCategory.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
