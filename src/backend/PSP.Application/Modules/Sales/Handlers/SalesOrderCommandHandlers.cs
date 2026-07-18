using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) cho Đơn hàng bán lẻ (SalesOrder).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này hiện thực logic tạo mới, cập nhật trạng thái (thanh toán/hủy đơn) và xóa đơn hàng.
/// - Áp dụng các quy tắc nghiệp vụ (Business Rules) chặt chẽ về tồn kho, kiểm tra IMEI, áp dụng Voucher và hoàn kho khi hủy đơn.
/// </summary>
public class SalesOrderCommandHandlers :
    IRequestHandler<CreateSalesOrderCommand, Guid>,
    IRequestHandler<UpdateSalesOrderStatusCommand, bool>,
    IRequestHandler<DeleteSalesOrderCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public SalesOrderCommandHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Xử lý Tạo mới Đơn bán hàng (Happy Path và các Error validation).
    /// </summary>
    public async Task<Guid> Handle(CreateSalesOrderCommand request, CancellationToken cancellationToken)
    {
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();

        // 1. Kiểm tra Khách hàng có tồn tại không
        var customer = await customerRepo.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.CustomerId);
        }

        // 2. Kiểm tra Chi nhánh có tồn tại không
        var branch = await branchRepo.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            throw new NotFoundException("Chi nhánh", request.BranchId);
        }

        // 3. Khởi tạo tính toán tổng tiền đơn hàng
        decimal subtotal = 0;
        var orderItems = new List<SalesOrderItemEntity>();

        // Lấy danh sách kho thuộc chi nhánh này
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var branchWarehouses = await warehouseRepo.FindAsync(w => w.BranchId == request.BranchId, cancellationToken);
        var branchWarehouseIds = branchWarehouses.Select(w => w.Id).ToList();

        if (!branchWarehouseIds.Any())
        {
            throw new BadRequestException("Chi nhánh này hiện chưa có kho hàng hoạt động nào.");
        }

        // 4. Lặp qua từng dòng sản phẩm được mua để kiểm tra tồn kho và lấy giá bán
        foreach (var itemDto in request.Items)
        {
            var variant = await variantRepo.GetByIdAsync(itemDto.ProductVariantId, cancellationToken);
            if (variant == null)
            {
                throw new NotFoundException("Biến thể sản phẩm", itemDto.ProductVariantId);
            }

            // Kiểm tra xem sản phẩm có yêu cầu quản lý theo số IMEI không
            var isImeiControlled = await IsImeiControlledAsync(variant.Id, cancellationToken);

            if (isImeiControlled)
            {
                // RÀNG BUỘC BR-INV-03: Bắt buộc điền IMEI đối với điện thoại di động
                if (string.IsNullOrWhiteSpace(itemDto.Imei))
                {
                    throw new BadRequestException($"Sản phẩm '{variant.Name}' yêu cầu mã IMEI bắt buộc.");
                }

                var cleanImei = itemDto.Imei.Trim();

                // Kiểm tra sự tồn tại và trạng thái của IMEI trong kho của chi nhánh
                var imeiRepo = _unitOfWork.Repository<ImeiEntity>();
                var imeis = await imeiRepo.FindAsync(x => x.Imei == cleanImei, cancellationToken);
                var imei = imeis.FirstOrDefault();

                if (imei == null)
                {
                    throw new BadRequestException($"Mã IMEI '{cleanImei}' không tồn tại trên hệ thống.");
                }

                // BR-405: Kiểm tra IMEI phải ở trạng thái "InStock"
                if (imei.Status != ImeiStatus.InStock)
                {
                    throw new BadRequestException($"Thiết bị với mã IMEI '{cleanImei}' không có sẵn để bán (Trạng thái hiện tại: {imei.Status}).");
                }

                // Đảm bảo thiết bị này đang nằm tại kho thuộc chi nhánh hiện tại
                if (!imei.WarehouseId.HasValue || !branchWarehouseIds.Contains(imei.WarehouseId.Value))
                {
                    throw new BadRequestException($"Thiết bị với mã IMEI '{cleanImei}' nằm ở chi nhánh khác, không thể xuất bán tại đây.");
                }

                // Cộng tiền đơn hàng
                subtotal += variant.SalePrice * itemDto.Quantity;

                // Thêm chi tiết mặt hàng
                orderItems.Add(new SalesOrderItemEntity
                {
                    ProductVariantId = variant.Id,
                    Imei = cleanImei,
                    Quantity = 1, // Hàng theo IMEI thì số lượng bắt buộc là 1 trên mỗi dòng
                    UnitPrice = variant.SalePrice,
                    Discount = 0 // Giảm giá voucher tính ở cấp độ hóa đơn
                });
            }
            else
            {
                // Đối với mặt hàng không quản lý theo IMEI (ví dụ phụ kiện)
                if (itemDto.Quantity <= 0)
                {
                    throw new BadRequestException($"Số lượng mua của sản phẩm '{variant.Name}' phải lớn hơn 0.");
                }

                // BR-INV-01: Kiểm tra tổng số lượng tồn kho khả dụng tại tất cả các kho của chi nhánh này
                var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
                var inventories = await inventoryRepo.FindAsync(
                    inv => branchWarehouseIds.Contains(inv.WarehouseId) && inv.ProductVariantId == variant.Id,
                    cancellationToken
                );
                
                var availableQty = inventories.Sum(i => i.Quantity);
                if (availableQty < itemDto.Quantity)
                {
                    throw new InventoryNotEnoughException(variant.Name, itemDto.Quantity, availableQty);
                }

                subtotal += variant.SalePrice * itemDto.Quantity;

                orderItems.Add(new SalesOrderItemEntity
                {
                    ProductVariantId = variant.Id,
                    Imei = null,
                    Quantity = itemDto.Quantity,
                    UnitPrice = variant.SalePrice,
                    Discount = 0
                });
            }
        }

        // 5. Tính toán Voucher giảm giá (nếu có)
        decimal discount = 0;
        Guid? voucherId = null;

        if (!string.IsNullOrWhiteSpace(request.VoucherCode))
        {
            var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
            var cleanVoucherCode = request.VoucherCode.Trim();

            var vouchers = await voucherRepo.FindAsync(v => v.Code == cleanVoucherCode && !v.IsDeleted, cancellationToken);
            var voucher = vouchers.FirstOrDefault();

            if (voucher == null)
            {
                throw new BadRequestException($"Mã giảm giá '{cleanVoucherCode}' không tồn tại hoặc đã bị xóa.");
            }

            // Kiểm tra tính hợp lệ của Voucher
            if (voucher.Status != VoucherStatus.Active)
            {
                throw new BadRequestException($"Mã giảm giá '{cleanVoucherCode}' không thể sử dụng (Trạng thái: {voucher.Status}).");
            }

            if (voucher.ExpiryDate <= DateTime.UtcNow)
            {
                throw new BadRequestException("Mã giảm giá đã hết hạn sử dụng.");
            }

            if (voucher.UsageCount >= voucher.UsageLimit)
            {
                throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng.");
            }

            if (subtotal < voucher.MinOrderValue)
            {
                throw new BadRequestException($"Giá trị đơn hàng ({subtotal:N0}đ) chưa đạt mức tối thiểu ({voucher.MinOrderValue:N0}đ) để áp dụng Voucher.");
            }

            // Kiểm tra chương trình khuyến mãi cha
            var promotionRepo = _unitOfWork.Repository<PromotionEntity>();
            var promotion = await promotionRepo.GetByIdAsNoTrackingAsync(voucher.PromotionId, cancellationToken);
            
            if (promotion == null || !promotion.IsActive || DateTime.UtcNow < promotion.StartDate || DateTime.UtcNow > promotion.EndDate)
            {
                throw new BadRequestException("Chương trình khuyến mãi đi kèm mã giảm giá này đã ngừng hoặc không có hiệu lực.");
            }

            // Đủ điều kiện, tính toán giảm giá
            voucherId = voucher.Id;
            discount = voucher.DiscountAmount;
            
            // Số tiền giảm giá tối đa bằng giá trị đơn hàng
            if (discount > subtotal)
            {
                discount = subtotal;
            }
        }

        decimal total = subtotal - discount;

        // 6. Tạo mã số đơn hàng tự động duy nhất
        var orderCode = "SO-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        // 7. Tạo thực thể SalesOrder chính
        Guid employeeId = Guid.Parse("20000000-0000-0000-0000-000000000001"); // Mặc định là Admin được seeder gieo sẵn
        if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var parsedGuid))
        {
            employeeId = parsedGuid;
        }

        var salesOrder = new SalesOrderEntity
        {
            CustomerId = request.CustomerId,
            UserId = employeeId,
            BranchId = request.BranchId,
            VoucherId = voucherId,
            Code = orderCode,
            Status = SalesOrderStatus.Pending, // Mặc định ở trạng thái chờ duyệt/thanh toán
            Subtotal = subtotal,
            Discount = discount,
            Total = total
        };

        // Lưu đơn hàng
        await salesOrderRepo.AddAsync(salesOrder, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 8. Lưu danh sách chi tiết các mặt hàng vào DB
        foreach (var item in orderItems)
        {
            item.SalesOrderId = salesOrder.Id;
            await salesOrderItemRepo.AddAsync(item, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return salesOrder.Id;
    }

    /// <summary>
    /// Cập nhật trạng thái đơn hàng (Duyệt thanh toán / Hủy đơn - trừ kho và hoàn kho).
    /// </summary>
    public async Task<bool> Handle(UpdateSalesOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // 1. Tìm đơn hàng
        var order = await salesOrderRepo.GetByIdAsync(request.Id, cancellationToken);
        if (order == null)
        {
            throw new NotFoundException("Đơn hàng", request.Id);
        }

        // 2. Nếu trạng thái trùng lặp thì không làm gì
        if (order.Status == request.Status)
        {
            return true;
        }

        // 3. Lấy danh sách các mặt hàng trong đơn hàng
        var items = await salesOrderItemRepo.FindAsync(x => x.SalesOrderId == order.Id, cancellationToken);

        // Lấy danh sách kho của chi nhánh để thao tác tồn kho
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var branchWarehouses = await warehouseRepo.FindAsync(w => w.BranchId == order.BranchId, cancellationToken);
        var primaryWarehouse = branchWarehouses.OrderByDescending(w => w.CreatedAt).FirstOrDefault();

        if (primaryWarehouse == null)
        {
            throw new BadRequestException("Chi nhánh không có kho hàng nào để hoàn tất/hủy đơn.");
        }

        // =====================================================================
        // TRƯỜNG HỢP 1: HOÀN TẤT ĐƠN HÀNG (Chuyển sang Completed)
        // =====================================================================
        if (request.Status == SalesOrderStatus.Completed)
        {
            if (order.Status == SalesOrderStatus.Cancelled)
            {
                throw new BadRequestException("Đơn hàng đã bị hủy trước đó, không thể chuyển sang trạng thái Hoàn thành.");
            }

            foreach (var item in items)
            {
                if (!string.IsNullOrEmpty(item.Imei))
                {
                    // Lấy thực thể IMEI
                    var imeis = await imeiRepo.FindAsync(x => x.Imei == item.Imei, cancellationToken);
                    var imei = imeis.FirstOrDefault();
                    
                    if (imei == null || imei.Status != ImeiStatus.InStock || !imei.WarehouseId.HasValue)
                    {
                        throw new BadRequestException($"Mã IMEI '{item.Imei}' không còn sẵn trong kho để xuất bán.");
                    }

                    var sourceWarehouseId = imei.WarehouseId.Value;

                    // Cập nhật trạng thái IMEI: Đổi thành SOLD, rời khỏi kho (WarehouseId = null)
                    imei.Status = ImeiStatus.Sold;
                    imei.WarehouseId = null;
                    imeiRepo.Update(imei);

                    // Trừ tồn kho vật lý tại kho chứa thiết bị đó
                    var inventories = await inventoryRepo.FindAsync(
                        inv => inv.WarehouseId == sourceWarehouseId && inv.ProductVariantId == item.ProductVariantId,
                        cancellationToken
                    );
                    var inventory = inventories.FirstOrDefault();
                    if (inventory != null)
                    {
                        inventory.Quantity = Math.Max(0, inventory.Quantity - 1);
                        inventoryRepo.Update(inventory);
                    }
                }
                else
                {
                    // Mặt hàng không quản lý theo IMEI (trừ kho tại kho hàng đầu tiên có đủ số lượng)
                    var branchWarehouseIds = branchWarehouses.Select(w => w.Id).ToList();
                    var inventories = await inventoryRepo.FindAsync(
                        inv => branchWarehouseIds.Contains(inv.WarehouseId) && inv.ProductVariantId == item.ProductVariantId && inv.Quantity >= item.Quantity,
                        cancellationToken
                    );
                    var inventory = inventories.FirstOrDefault();

                    if (inventory == null)
                    {
                        throw new BadRequestException("Tồn kho vật lý tại chi nhánh hiện tại không đủ để xuất hàng.");
                    }

                    inventory.Quantity -= item.Quantity;
                    inventoryRepo.Update(inventory);
                }
            }

            // Tăng số lần sử dụng của Voucher nếu có áp dụng
            if (order.VoucherId.HasValue)
            {
                var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
                var voucher = await voucherRepo.GetByIdAsync(order.VoucherId.Value, cancellationToken);
                if (voucher != null)
                {
                    voucher.UsageCount += 1;
                    if (voucher.UsageCount >= voucher.UsageLimit)
                    {
                        voucher.Status = VoucherStatus.Used;
                    }
                    voucherRepo.Update(voucher);
                }
            }

            order.Status = SalesOrderStatus.Completed;
            salesOrderRepo.Update(order);
        }
        // =====================================================================
        // TRƯỜNG HỢP 2: HỦY ĐƠN HÀNG (Chuyển sang Cancelled)
        // =====================================================================
        else if (request.Status == SalesOrderStatus.Cancelled)
        {
            // Nếu đơn hàng đã hoàn tất trước đó, khi hủy ta phải HOÀN TRẢ tồn kho và IMEI về kho chính
            if (order.Status == SalesOrderStatus.Completed)
            {
                foreach (var item in items)
                {
                    if (!string.IsNullOrEmpty(item.Imei))
                    {
                        // Hoàn trả IMEI về kho chính
                        var imeis = await imeiRepo.FindAsync(x => x.Imei == item.Imei, cancellationToken);
                        var imei = imeis.FirstOrDefault();
                        
                        if (imei != null)
                        {
                            imei.Status = ImeiStatus.InStock;
                            imei.WarehouseId = primaryWarehouse.Id; // Trả về kho chính của chi nhánh
                            imeiRepo.Update(imei);
                        }

                        // Hoàn trả số lượng tồn kho
                        var inventories = await inventoryRepo.FindAsync(
                            inv => inv.WarehouseId == primaryWarehouse.Id && inv.ProductVariantId == item.ProductVariantId,
                            cancellationToken
                        );
                        var inventory = inventories.FirstOrDefault();
                        if (inventory != null)
                        {
                            inventory.Quantity += 1;
                            inventoryRepo.Update(inventory);
                        }
                    }
                    else
                    {
                        // Hoàn trả số lượng sản phẩm thường
                        var inventories = await inventoryRepo.FindAsync(
                            inv => inv.WarehouseId == primaryWarehouse.Id && inv.ProductVariantId == item.ProductVariantId,
                            cancellationToken
                        );
                        var inventory = inventories.FirstOrDefault();
                        if (inventory != null)
                        {
                            inventory.Quantity += item.Quantity;
                            inventoryRepo.Update(inventory);
                        }
                    }
                }

                // Giảm bớt số lần sử dụng của Voucher nếu có liên kết
                if (order.VoucherId.HasValue)
                {
                    var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
                    var voucher = await voucherRepo.GetByIdAsync(order.VoucherId.Value, cancellationToken);
                    if (voucher != null)
                    {
                        voucher.UsageCount = Math.Max(0, voucher.UsageCount - 1);
                        if (voucher.Status == VoucherStatus.Used && voucher.UsageCount < voucher.UsageLimit)
                        {
                            voucher.Status = VoucherStatus.Active;
                        }
                        voucherRepo.Update(voucher);
                    }
                }
            }

            order.Status = SalesOrderStatus.Cancelled;
            salesOrderRepo.Update(order);
        }
        else
        {
            // Đối với các trạng thái khác (Pending, Confirmed) chỉ cập nhật cờ trạng thái đơn hàng đơn thuần
            order.Status = request.Status;
            salesOrderRepo.Update(order);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Xóa mềm đơn hàng (Chỉ cho phép xóa khi đơn hàng chưa Hoàn thành).
    /// </summary>
    public async Task<bool> Handle(DeleteSalesOrderCommand request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();

        var order = await salesOrderRepo.GetByIdAsync(request.Id, cancellationToken);
        if (order == null)
        {
            throw new NotFoundException("Đơn hàng", request.Id);
        }

        // Ràng buộc bảo toàn dữ liệu tài chính
        if (order.Status == SalesOrderStatus.Completed)
        {
            throw new BadRequestException("unable to delete the already complete order... unable to delete the already completed order... không thể thực hiện xóa đơn hàng đã hoàn tất giao dịch.");
        }

        // Xóa mềm đơn hàng chính
        salesOrderRepo.Remove(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    // =====================================================================
    // HÀM HỖ TRỢ (Helper Methods)
    // =====================================================================

    /// <summary>
    /// Kiểm tra xem biến thể sản phẩm đó có quản lý theo định danh IMEI không.
    /// </summary>
    private async Task<bool> IsImeiControlledAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var variant = await _unitOfWork.Repository<ProductVariantEntity>().GetByIdAsNoTrackingAsync(productVariantId, cancellationToken);
        if (variant == null) return false;

        var product = await _unitOfWork.Repository<ProductEntity>().GetByIdAsNoTrackingAsync(variant.ProductId, cancellationToken);
        if (product == null) return false;

        var category = await _unitOfWork.Repository<CategoryEntity>().GetByIdAsNoTrackingAsync(product.CategoryId, cancellationToken);
        if (category == null) return false;

        // Bán điện thoại thuộc nhóm danh mục bắt đầu bằng MOBILE (e.g. MOBILE_PHONE)
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
