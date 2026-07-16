using MediatR;
using PSP.Application.Common.Interfaces;
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
/// HANDLER xử lý các yêu cầu thay đổi dữ liệu của Phiếu điều chuyển kho (Create, Update, Ship, Receive, Cancel, Delete).
/// </summary>
public class WarehouseTransferCommandHandlers :
    IRequestHandler<CreateWarehouseTransferCommand, Guid>,
    IRequestHandler<UpdateWarehouseTransferCommand, bool>,
    IRequestHandler<ShipWarehouseTransferCommand, bool>,
    IRequestHandler<ReceiveWarehouseTransferCommand, bool>,
    IRequestHandler<CancelWarehouseTransferCommand, bool>,
    IRequestHandler<DeleteWarehouseTransferCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public WarehouseTransferCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới Phiếu điều chuyển kho (Trạng thái mặc định là Pending).
    /// </summary>
    public async Task<Guid> Handle(CreateWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra kho nguồn và kho đích
        if (request.FromWarehouseId == request.ToWarehouseId)
        {
            throw new BadRequestException("Kho nguồn và kho đích không được trùng nhau.");
        }

        var fromWh = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.FromWarehouseId, cancellationToken);
        if (fromWh == null)
        {
            throw new NotFoundException("Kho xuất hàng", request.FromWarehouseId);
        }

        var toWh = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.ToWarehouseId, cancellationToken);
        if (toWh == null)
        {
            throw new NotFoundException("Kho nhận hàng", request.ToWarehouseId);
        }

        // 2. Kiểm tra trùng lặp mã phiếu điều chuyển (Code)
        var existing = await _unitOfWork.Repository<WarehouseTransferEntity>().FindAsync(t => t.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Mã phiếu điều chuyển '{request.Code}' đã tồn tại trong hệ thống.");
        }

        // 3. Kiểm tra tính sẵn có của hàng tồn kho tại kho xuất (BR-501)
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        foreach (var itemDto in request.Items)
        {
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            var invs = await inventoryRepo.FindAsync(i => i.WarehouseId == request.FromWarehouseId && i.ProductVariantId == itemDto.ProductVariantId, cancellationToken);
            var inventory = invs.FirstOrDefault();
            
            if (inventory == null || inventory.Quantity < itemDto.Quantity)
            {
                throw new ConflictException($"Kho nguồn '{fromWh.Name}' không đủ số lượng tồn cho biến thể '{variant.Name}'. Hiện có: {(inventory?.Quantity ?? 0)}, Yêu cầu chuyển: {itemDto.Quantity}.");
            }
        }

        // 4. Tạo phiếu điều chuyển chính
        var transfer = new WarehouseTransferEntity
        {
            FromWarehouseId = request.FromWarehouseId,
            ToWarehouseId = request.ToWarehouseId,
            Code = request.Code,
            Status = WarehouseTransferStatus.Pending
        };

        await _unitOfWork.Repository<WarehouseTransferEntity>().AddAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Tạo các dòng chi tiết mặt hàng chuyển
        foreach (var itemDto in request.Items)
        {
            var item = new WarehouseTransferItemEntity
            {
                TransferId = transfer.Id,
                ProductVariantId = itemDto.ProductVariantId,
                Quantity = itemDto.Quantity
            };
            await _unitOfWork.Repository<WarehouseTransferItemEntity>().AddAsync(item, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return transfer.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin phiếu điều chuyển (Chỉ được phép khi ở trạng thái Pending).
    /// </summary>
    public async Task<bool> Handle(UpdateWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var itemRepo = _unitOfWork.Repository<WarehouseTransferItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();

        // 1. Tìm phiếu điều chuyển
        var transfer = await transferRepo.GetByIdAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển", request.Id);
        }

        // 2. Ràng buộc: Chỉ sửa khi ở trạng thái Pending
        if (transfer.Status != WarehouseTransferStatus.Pending)
        {
            throw new ConflictException("Chỉ được sửa phiếu chuyển kho ở trạng thái Chờ xử lý (Pending).");
        }

        // 3. Kiểm tra kho hàng nguồn và đích
        if (request.FromWarehouseId == request.ToWarehouseId)
        {
            throw new BadRequestException("Kho nguồn và kho đích không được trùng nhau.");
        }

        var fromWh = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.FromWarehouseId, cancellationToken);
        if (fromWh == null)
        {
            throw new NotFoundException("Kho xuất hàng", request.FromWarehouseId);
        }

        var toWh = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.ToWarehouseId, cancellationToken);
        if (toWh == null)
        {
            throw new NotFoundException("Kho nhận hàng", request.ToWarehouseId);
        }

        // 4. Kiểm tra hàng tồn ở kho nguồn
        foreach (var itemDto in request.Items)
        {
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            var invs = await inventoryRepo.FindAsync(i => i.WarehouseId == request.FromWarehouseId && i.ProductVariantId == itemDto.ProductVariantId, cancellationToken);
            var inventory = invs.FirstOrDefault();
            
            if (inventory == null || inventory.Quantity < itemDto.Quantity)
            {
                throw new ConflictException($"Kho nguồn '{fromWh.Name}' không đủ số lượng tồn cho biến thể '{variant.Name}'. Hiện có: {(inventory?.Quantity ?? 0)}, Yêu cầu chuyển: {itemDto.Quantity}.");
            }
        }

        // 5. Xóa sạch các chi tiết cũ
        var oldItems = await itemRepo.FindAsync(i => i.TransferId == transfer.Id, cancellationToken);
        foreach (var oldItem in oldItems)
        {
            itemRepo.Remove(oldItem);
        }

        // 6. Thêm các chi tiết mới
        foreach (var itemDto in request.Items)
        {
            var item = new WarehouseTransferItemEntity
            {
                TransferId = transfer.Id,
                ProductVariantId = itemDto.ProductVariantId,
                Quantity = itemDto.Quantity
            };
            await itemRepo.AddAsync(item, cancellationToken);
        }

        // 7. Cập nhật phiếu chính
        transfer.FromWarehouseId = request.FromWarehouseId;
        transfer.ToWarehouseId = request.ToWarehouseId;
        transferRepo.Update(transfer);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý chuyển đổi trạng thái sang Đang chuyển hàng (InTransit).
    /// </summary>
    public async Task<bool> Handle(ShipWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var itemRepo = _unitOfWork.Repository<WarehouseTransferItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();

        var transfer = await transferRepo.GetByIdAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển", request.Id);
        }

        if (transfer.Status != WarehouseTransferStatus.Pending)
        {
            throw new ConflictException("Chỉ được xuất giao hàng cho phiếu điều chuyển ở trạng thái Chờ xử lý (Pending).");
        }

        // Kiểm định lại tồn kho lần cuối trước khi xe lăn bánh xuất hàng
        var items = await itemRepo.FindAsync(i => i.TransferId == transfer.Id, cancellationToken);
        foreach (var item in items)
        {
            var invs = await inventoryRepo.FindAsync(i => i.WarehouseId == transfer.FromWarehouseId && i.ProductVariantId == item.ProductVariantId, cancellationToken);
            var inventory = invs.FirstOrDefault();
            if (inventory == null || inventory.Quantity < item.Quantity)
            {
                var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(item.ProductVariantId, cancellationToken);
                throw new ConflictException($"Xuất hàng thất bại: Kho nguồn không đủ tồn cho biến thể '{variant?.Name}'.");
            }
        }

        transfer.Status = WarehouseTransferStatus.InTransit;
        transferRepo.Update(transfer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý nhận hàng thành công (Received): Đồng thời trừ tồn kho nguồn, cộng tồn kho đích và đổi WarehouseId cho các IMEI (BR-503, BR-505).
    /// </summary>
    public async Task<bool> Handle(ReceiveWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var itemRepo = _unitOfWork.Repository<WarehouseTransferItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // 1. Tìm phiếu điều chuyển
        var transfer = await transferRepo.GetByIdAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển", request.Id);
        }

        // 2. Ràng buộc: Chỉ nhận khi đang InTransit
        if (transfer.Status != WarehouseTransferStatus.InTransit)
        {
            throw new ConflictException("Chỉ được nhận hàng khi phiếu điều chuyển đang ở trạng thái Đang vận chuyển (InTransit).");
        }

        // 3. Lấy danh sách mặt hàng cần điều chuyển
        var items = await itemRepo.FindAsync(i => i.TransferId == transfer.Id, cancellationToken);

        // 4. Xử lý trừ kho nguồn, cộng kho đích và cập nhật IMEI
        foreach (var item in items)
        {
            // Kiểm tra xem sản phẩm này có quản lý theo IMEI hay không
            var isImeiRequired = await IsImeiControlledAsync(item.ProductVariantId, cancellationToken);

            if (isImeiRequired)
            {
                // Lấy danh sách IMEI được chọn để chuyển đi
                var supplied = request.VariantImeis.FirstOrDefault(x => x.ProductVariantId == item.ProductVariantId);
                var imeisList = supplied?.Imeis ?? new List<string>();

                if (imeisList.Count != item.Quantity)
                {
                    throw new BadRequestException($"Mặt hàng với ID biến thể '{item.ProductVariantId}' yêu cầu chọn đúng {item.Quantity} mã IMEI để chuyển đi, nhưng nhận được {imeisList.Count} mã.");
                }

                foreach (var imei in imeisList)
                {
                    var cleanImei = imei.Trim();
                    // Xác thực mã IMEI phải nằm tại kho xuất nguồn và đang ở trạng thái InStock
                    var existingImeis = await imeiRepo.FindAsync(
                        i => i.Imei == cleanImei && i.WarehouseId == transfer.FromWarehouseId && i.Status == ImeiStatus.InStock,
                        cancellationToken
                    );
                    var imeiEntity = existingImeis.FirstOrDefault();
                    if (imeiEntity == null)
                    {
                        throw new ConflictException($"Mã IMEI '{cleanImei}' không hợp lệ hoặc không có sẵn (InStock) tại kho nguồn của phiếu chuyển.");
                    }

                    // Cập nhật vị trí kho mới cho thẻ IMEI
                    imeiEntity.WarehouseId = transfer.ToWarehouseId;
                    imeiEntity.UpdatedAt = DateTime.UtcNow;
                    imeiRepo.Update(imeiEntity);
                }
            }

            // 5. Trừ số lượng tồn ở kho xuất nguồn
            var sourceInvs = await inventoryRepo.FindAsync(
                inv => inv.WarehouseId == transfer.FromWarehouseId && inv.ProductVariantId == item.ProductVariantId,
                cancellationToken
            );
            var sourceInv = sourceInvs.FirstOrDefault();
            if (sourceInv == null || sourceInv.Quantity < item.Quantity)
            {
                var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(item.ProductVariantId, cancellationToken);
                throw new ConflictException($"Xung đột: Kho nguồn không đủ tồn tại thời điểm hoàn tất nhận hàng cho biến thể '{variant?.Name}'.");
            }
            sourceInv.Quantity -= item.Quantity;
            inventoryRepo.Update(sourceInv);

            // 6. Cộng số lượng tồn ở kho nhận đích (tạo mới bản ghi tồn kho nếu kho đích chưa từng có sản phẩm này)
            var targetInvs = await inventoryRepo.FindAsync(
                inv => inv.WarehouseId == transfer.ToWarehouseId && inv.ProductVariantId == item.ProductVariantId,
                cancellationToken
            );
            var targetInv = targetInvs.FirstOrDefault();
            if (targetInv == null)
            {
                targetInv = new InventoryEntity
                {
                    WarehouseId = transfer.ToWarehouseId,
                    ProductVariantId = item.ProductVariantId,
                    Quantity = item.Quantity,
                    MinimumStock = 5
                };
                await inventoryRepo.AddAsync(targetInv, cancellationToken);
            }
            else
            {
                targetInv.Quantity += item.Quantity;
                inventoryRepo.Update(targetInv);
            }
        }

        // 7. Cập nhật trạng thái phiếu điều chuyển sang Đã nhận (Received)
        transfer.Status = WarehouseTransferStatus.Received;
        transferRepo.Update(transfer);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý hủy phiếu điều chuyển kho (Pending/InTransit -> Cancelled).
    /// </summary>
    public async Task<bool> Handle(CancelWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var transfer = await transferRepo.GetByIdAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển", request.Id);
        }

        if (transfer.Status != WarehouseTransferStatus.Pending && transfer.Status != WarehouseTransferStatus.InTransit)
        {
            throw new ConflictException("Phiếu điều chuyển đã nhận hàng hoặc đã hủy trước đó.");
        }

        transfer.Status = WarehouseTransferStatus.Cancelled;
        transferRepo.Update(transfer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm Phiếu điều chuyển kho (Chỉ áp dụng khi ở trạng thái Pending).
    /// </summary>
    public async Task<bool> Handle(DeleteWarehouseTransferCommand request, CancellationToken cancellationToken)
    {
        var transferRepo = _unitOfWork.Repository<WarehouseTransferEntity>();
        var transfer = await transferRepo.GetByIdAsync(request.Id, cancellationToken);
        if (transfer == null)
        {
            throw new NotFoundException("Phiếu điều chuyển", request.Id);
        }

        if (transfer.Status != WarehouseTransferStatus.Pending)
        {
            throw new ConflictException("Chỉ được phép xóa phiếu điều chuyển ở trạng thái Chờ xử lý (Pending).");
        }

        transferRepo.Remove(transfer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// HÀM TRỢ GIÚP: Xác định xem biến thể sản phẩm có bắt buộc quản lý theo IMEI hay không.
    /// </summary>
    private async Task<bool> IsImeiControlledAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsNoTrackingAsync(productVariantId, cancellationToken);
        if (variant == null) return false;

        var product = await _unitOfWork.Repository<ProductEntity>().GetByIdAsNoTrackingAsync(variant.ProductId, cancellationToken);
        if (product == null) return false;

        var category = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(product.CategoryId, cancellationToken);
        if (category == null) return false;

        if (category.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase)) return true;

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
