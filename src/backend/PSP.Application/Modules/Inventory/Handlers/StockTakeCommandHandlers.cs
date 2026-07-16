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
/// HANDLER xử lý các yêu cầu thay đổi dữ liệu của Phiếu kiểm kê kho (Create, Update, Start, Complete, Cancel, Delete).
/// </summary>
public class StockTakeCommandHandlers :
    IRequestHandler<CreateStockTakeCommand, Guid>,
    IRequestHandler<UpdateStockTakeCommand, bool>,
    IRequestHandler<StartStockTakeCommand, bool>,
    IRequestHandler<CompleteStockTakeCommand, bool>,
    IRequestHandler<CancelStockTakeCommand, bool>,
    IRequestHandler<DeleteStockTakeCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public StockTakeCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới Phiếu kiểm kê kho (Draft).
    /// </summary>
    public async Task<Guid> Handle(CreateStockTakeCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _unitOfWork.Repository<WarehouseEntity>().GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.WarehouseId);
        }

        var existing = await _unitOfWork.Repository<StockTakeEntity>().FindAsync(s => s.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Mã phiếu kiểm kê '{request.Code}' đã tồn tại trong hệ thống.");
        }

        var stockTake = new StockTakeEntity
        {
            WarehouseId = request.WarehouseId,
            Code = request.Code,
            Status = StockTakeStatus.Draft
        };

        await _unitOfWork.Repository<StockTakeEntity>().AddAsync(stockTake, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();

        foreach (var itemDto in request.Items)
        {
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            // Lấy số lượng trên phần mềm tại thời điểm tạo phiếu
            var invs = await inventoryRepo.FindAsync(i => i.WarehouseId == request.WarehouseId && i.ProductVariantId == itemDto.ProductVariantId, cancellationToken);
            var systemQty = invs.FirstOrDefault()?.Quantity ?? 0;

            var item = new StockTakeItemEntity
            {
                StockTakeId = stockTake.Id,
                ProductVariantId = itemDto.ProductVariantId,
                SystemQuantity = systemQty,
                ActualQuantity = itemDto.ActualQuantity,
                Difference = itemDto.ActualQuantity - systemQty,
                Note = itemDto.Note
            };

            await _unitOfWork.Repository<StockTakeItemEntity>().AddAsync(item, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return stockTake.Id;
    }

    /// <summary>
    /// Xử lý cập nhật số lượng thực tế kiểm kê (Chỉ được phép ở trạng thái Draft hoặc InProgress).
    /// </summary>
    public async Task<bool> Handle(UpdateStockTakeCommand request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var itemRepo = _unitOfWork.Repository<StockTakeItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();

        var stockTake = await stockTakeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê", request.Id);
        }

        if (stockTake.Status != StockTakeStatus.Draft && stockTake.Status != StockTakeStatus.InProgress)
        {
            throw new ConflictException("Chỉ được sửa phiếu kiểm kê ở trạng thái Nháp hoặc Đang kiểm kê.");
        }

        // Xóa các mặt hàng kiểm đếm cũ
        var oldItems = await itemRepo.FindAsync(i => i.StockTakeId == stockTake.Id, cancellationToken);
        foreach (var oldItem in oldItems)
        {
            itemRepo.Remove(oldItem);
        }

        // Thêm mặt hàng kiểm đếm mới
        foreach (var itemDto in request.Items)
        {
            var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            var invs = await inventoryRepo.FindAsync(i => i.WarehouseId == stockTake.WarehouseId && i.ProductVariantId == itemDto.ProductVariantId, cancellationToken);
            var systemQty = invs.FirstOrDefault()?.Quantity ?? 0;

            var item = new StockTakeItemEntity
            {
                StockTakeId = stockTake.Id,
                ProductVariantId = itemDto.ProductVariantId,
                SystemQuantity = systemQty,
                ActualQuantity = itemDto.ActualQuantity,
                Difference = itemDto.ActualQuantity - systemQty,
                Note = itemDto.Note
            };

            await itemRepo.AddAsync(item, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý chuyển đổi trạng thái sang Đang kiểm kê (InProgress).
    /// </summary>
    public async Task<bool> Handle(StartStockTakeCommand request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var stockTake = await stockTakeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê", request.Id);
        }

        if (stockTake.Status != StockTakeStatus.Draft)
        {
            throw new ConflictException("Chỉ được bắt đầu kiểm kê khi phiếu ở trạng thái Nháp (Draft).");
        }

        stockTake.Status = StockTakeStatus.InProgress;
        stockTakeRepo.Update(stockTake);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý hoàn tất kiểm kê (Completed): Cân bằng tồn kho sổ sách theo thực tế kiểm đếm, đối soát và hủy/thêm IMEI (BR-506).
    /// </summary>
    public async Task<bool> Handle(CompleteStockTakeCommand request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var itemRepo = _unitOfWork.Repository<StockTakeItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // 1. Tìm phiếu kiểm kê
        var stockTake = await stockTakeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê", request.Id);
        }

        // 2. Kiểm tra trạng thái
        if (stockTake.Status != StockTakeStatus.InProgress)
        {
            throw new ConflictException("Chỉ có thể hoàn tất khi phiếu đang ở trạng thái Đang kiểm kê (InProgress).");
        }

        var items = await itemRepo.FindAsync(i => i.StockTakeId == stockTake.Id, cancellationToken);

        // 3. Đối soát tồn kho và IMEI cho từng sản phẩm
        foreach (var item in items)
        {
            var isImeiRequired = await IsImeiControlledAsync(item.ProductVariantId, cancellationToken);

            if (isImeiRequired)
            {
                // Lấy danh sách IMEI thực tế kiểm đếm được truyền lên
                var supplied = request.VariantImeis.FirstOrDefault(x => x.ProductVariantId == item.ProductVariantId);
                var actualImeisList = supplied?.Imeis ?? new List<string>();

                // Ràng buộc: Số lượng IMEI thực tế kiểm được phải khớp với số lượng thực tế khai báo
                if (actualImeisList.Count != item.ActualQuantity)
                {
                    throw new BadRequestException($"Mặt hàng với ID biến thể '{item.ProductVariantId}' yêu cầu đúng {item.ActualQuantity} mã IMEI thực tế, nhưng bạn chỉ cung cấp {actualImeisList.Count} mã.");
                }

                // A. Lấy danh sách IMEI hiện tại trong database tại kho này
                var dbImeis = await imeiRepo.FindAsync(
                    i => i.ProductVariantId == item.ProductVariantId && i.WarehouseId == stockTake.WarehouseId,
                    cancellationToken
                );

                // B. Đối soát: Các IMEI có trong DB nhưng không có trong danh sách kiểm đếm thực tế -> Đánh dấu Thất thoát (Disposed) và xóa khỏi kho
                foreach (var dbImei in dbImeis)
                {
                    if (!actualImeisList.Contains(dbImei.Imei))
                    {
                        dbImei.Status = ImeiStatus.Disposed;
                        dbImei.WarehouseId = null; // Trục xuất khỏi kho
                        dbImei.UpdatedAt = DateTime.UtcNow;
                        imeiRepo.Update(dbImei);
                    }
                    else if (dbImei.Status != ImeiStatus.InStock)
                    {
                        // Nếu IMEI thực tế có mặt và đang bị khóa trạng thái khác, hoàn trả về InStock
                        dbImei.Status = ImeiStatus.InStock;
                        dbImei.UpdatedAt = DateTime.UtcNow;
                        imeiRepo.Update(dbImei);
                    }
                }

                // C. Đối soát: Các IMEI có trong danh sách thực tế nhưng chưa có tại kho này trong DB -> Đăng ký mới hoặc thu hồi
                foreach (var actualImei in actualImeisList)
                {
                    var cleanImei = actualImei.Trim();
                    if (!dbImeis.Any(x => x.Imei == cleanImei))
                    {
                        // Kiểm tra xem IMEI này đã có trên hệ thống toàn cầu chưa
                        var globalImeis = await imeiRepo.FindAsync(i => i.Imei == cleanImei, cancellationToken);
                        var globalImei = globalImeis.FirstOrDefault();

                        if (globalImei != null)
                        {
                            // Nếu đã có ở kho khác hoặc trạng thái khác, cập nhật lại về kho này
                            globalImei.WarehouseId = stockTake.WarehouseId;
                            globalImei.Status = ImeiStatus.InStock;
                            globalImei.UpdatedAt = DateTime.UtcNow;
                            imeiRepo.Update(globalImei);
                        }
                        else
                        {
                            // Nếu là IMEI hoàn toàn mới, tiến hành gieo mới
                            var newImei = new ImeiEntity
                            {
                                Imei = cleanImei,
                                ProductVariantId = item.ProductVariantId,
                                WarehouseId = stockTake.WarehouseId,
                                Status = ImeiStatus.InStock
                            };
                            await imeiRepo.AddAsync(newImei, cancellationToken);
                        }
                    }
                }
            }

            // 4. Cân bằng số lượng tồn kho (InventoryEntity): Cập nhật cứng số lượng sổ sách bằng số lượng thực tế
            var invs = await inventoryRepo.FindAsync(
                inv => inv.WarehouseId == stockTake.WarehouseId && inv.ProductVariantId == item.ProductVariantId,
                cancellationToken
            );
            var inventory = invs.FirstOrDefault();

            if (inventory == null)
            {
                // Nếu chưa từng có mặt hàng này ở kho, tạo mới bản ghi tồn kho
                inventory = new InventoryEntity
                {
                    WarehouseId = stockTake.WarehouseId,
                    ProductVariantId = item.ProductVariantId,
                    Quantity = item.ActualQuantity,
                    MinimumStock = 5
                };
                await inventoryRepo.AddAsync(inventory, cancellationToken);
            }
            else
            {
                // Cập nhật đè số lượng kiểm thực tế
                inventory.Quantity = item.ActualQuantity;
                inventoryRepo.Update(inventory);
            }
        }

        // 5. Cập nhật trạng thái phiếu kiểm sang Completed (Hoàn tất)
        stockTake.Status = StockTakeStatus.Completed;
        stockTakeRepo.Update(stockTake);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý hủy phiếu kiểm kê kho.
    /// </summary>
    public async Task<bool> Handle(CancelStockTakeCommand request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var stockTake = await stockTakeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê", request.Id);
        }

        if (stockTake.Status != StockTakeStatus.Draft && stockTake.Status != StockTakeStatus.InProgress)
        {
            throw new ConflictException("Phiếu kiểm kê đã hoàn tất hoặc đã bị hủy trước đó.");
        }

        stockTake.Status = StockTakeStatus.Cancelled;
        stockTakeRepo.Update(stockTake);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm Phiếu kiểm kê kho (Chỉ áp dụng khi ở trạng thái Draft).
    /// </summary>
    public async Task<bool> Handle(DeleteStockTakeCommand request, CancellationToken cancellationToken)
    {
        var stockTakeRepo = _unitOfWork.Repository<StockTakeEntity>();
        var stockTake = await stockTakeRepo.GetByIdAsync(request.Id, cancellationToken);
        if (stockTake == null)
        {
            throw new NotFoundException("Phiếu kiểm kê", request.Id);
        }

        if (stockTake.Status != StockTakeStatus.Draft)
        {
            throw new ConflictException("Chỉ được phép xóa phiếu kiểm kê ở trạng thái Nháp (Draft).");
        }

        stockTakeRepo.Remove(stockTake);
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
