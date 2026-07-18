using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Repair.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Repair.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) của Phân hệ Dịch vụ - Sửa chữa (Module 15).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này hiện thực logic tạo phiếu sửa chữa, xuất linh kiện từ kho chi nhánh và cập nhật trạng thái sửa chữa.
/// - Tuân thủ nghiêm ngặt BUSINESS_RULE_AI:
///   1. Luân chuyển trạng thái chỉ đi theo chiều tiến (không quay lùi).
///   2. Tự động tính toán lại tổng tiền khi hoàn thành sửa chữa (ActualCost = LaborCost + PartsTotal).
///   3. Kiểm tra và trừ tồn kho vật lý tại kho của chi nhánh tiếp nhận khi xuất linh kiện.
///   4. Hoàn trả tồn kho vật lý của linh kiện nếu phiếu sửa chữa bị hủy.
/// </summary>
public class RepairCommandHandlers :
    IRequestHandler<CreateRepairTicketCommand, Guid>,
    IRequestHandler<AddRepairPartCommand, Guid>,
    IRequestHandler<UpdateRepairStatusCommand, bool>,
    IRequestHandler<DeleteRepairTicketCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public RepairCommandHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// 1. Xử lý tạo mới Phiếu sửa chữa (Tiếp nhận thiết bị lỗi).
    /// </summary>
    public async Task<Guid> Handle(CreateRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        // 1.1 Kiểm tra Khách hàng có tồn tại không
        var customer = await customerRepo.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.CustomerId);
        }

        // 1.2 Kiểm tra Thiết bị (Biến thể sản phẩm) có tồn tại trong danh mục không
        var variant = await variantRepo.GetByIdAsync(request.ProductVariantId, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Biến thể thiết bị sửa", request.ProductVariantId);
        }

        // 1.3 Kiểm tra Kỹ thuật viên phụ trách (nếu có truyền lên)
        if (request.TechnicianId.HasValue)
        {
            var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
            if (tech == null)
            {
                throw new NotFoundException("Kỹ thuật viên", request.TechnicianId.Value);
            }
        }

        // 1.4 Lấy thông tin người tiếp nhận từ tài khoản đang đăng nhập
        Guid employeeId = Guid.Empty;
        if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var parsedGuid))
        {
            employeeId = parsedGuid;
        }
        else
        {
            throw new BadRequestException("Không thể xác định thông tin nhân viên tiếp nhận phiếu.");
        }

        // 1.5 Tạo mã phiếu sửa chữa ngẫu nhiên nhưng theo chuẩn: REP-yyyyMMdd-XXXXXX
        var ticketCode = "REP-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        // 1.6 Khởi tạo phiếu sửa chữa với trạng thái mặc định ban đầu là Received (Tiếp nhận)
        var ticket = new RepairTicketEntity
        {
            CustomerId = request.CustomerId,
            ProductVariantId = request.ProductVariantId,
            Imei = request.Imei?.Trim(),
            ReceivedById = employeeId,
            TechnicianId = request.TechnicianId,
            Code = ticketCode,
            Status = RepairTicketStatus.Received,
            ProblemDescription = request.ProblemDescription.Trim(),
            EstimatedCost = request.EstimatedCost ?? 0,
            ActualCost = 0,
            LaborCost = 0,
            ReceivedDate = DateTime.UtcNow
        };

        await ticketRepo.AddAsync(ticket, cancellationToken);

        // 1.7 Ghi nhận lịch sử trạng thái đầu tiên
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = RepairTicketStatus.Received.ToString(),
            Note = "Tiếp nhận thiết bị lỗi từ khách hàng."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 1.8 Lưu thay đổi vào CSDL
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ticket.Id;
    }

    /// <summary>
    /// 2. Xử lý xuất linh kiện từ kho chi nhánh để lắp ráp/thay thế.
    /// </summary>
    public async Task<Guid> Handle(AddRepairPartCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();

        // 2.1 Tìm phiếu sửa chữa chính
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);
        }

        // Chặn xuất linh kiện nếu phiếu đã hoàn thành hoặc đã bị hủy
        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Cancelled)
        {
            throw new BadRequestException("Không thể xuất thêm linh kiện cho phiếu sửa chữa đã hoàn thành hoặc đã hủy.");
        }

        // 2.2 Tìm biến thể sản phẩm làm linh kiện thay thế
        var variant = await variantRepo.GetByIdAsync(request.ProductVariantId, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Linh kiện thay thế", request.ProductVariantId);
        }

        // 2.3 Tìm chi nhánh của nhân viên tiếp nhận phiếu để xác định kho hàng chi nhánh đó
        var receivedUser = await userRepo.GetByIdAsync(ticket.ReceivedById, cancellationToken);
        if (receivedUser == null)
        {
            throw new BadRequestException("Không tìm thấy nhân viên lập phiếu tiếp nhận.");
        }

        var branchId = receivedUser.BranchId;

        // Lấy danh sách các kho hàng đang hoạt động thuộc chi nhánh này
        var branchWarehouses = await warehouseRepo.FindAsync(w => w.BranchId == branchId && !w.IsDeleted, cancellationToken);
        var warehouseIds = branchWarehouses.Select(w => w.Id).ToList();

        if (!warehouseIds.Any())
        {
            throw new BadRequestException("Chi nhánh này không có kho hàng nào đang hoạt động để xuất linh kiện.");
        }

        // 2.4 Kiểm tra tồn kho của linh kiện thay thế tại các kho hàng thuộc chi nhánh này
        var inventories = await inventoryRepo.FindAsync(
            inv => warehouseIds.Contains(inv.WarehouseId) && inv.ProductVariantId == request.ProductVariantId, 
            cancellationToken
        );

        var totalAvailableStock = inventories.Sum(inv => inv.Quantity);
        if (totalAvailableStock < request.Quantity)
        {
            throw new InventoryNotEnoughException(variant.Name, request.Quantity, totalAvailableStock);
        }

        // 2.5 Khấu trừ tồn kho vật lý tương ứng (Trừ dần ở các kho có sẵn hàng)
        var remainingQtyToDeduct = request.Quantity;
        foreach (var inventory in inventories.Where(inv => inv.Quantity > 0).OrderByDescending(inv => inv.Quantity))
        {
            if (remainingQtyToDeduct <= 0) break;

            if (inventory.Quantity >= remainingQtyToDeduct)
            {
                inventory.Quantity -= remainingQtyToDeduct;
                remainingQtyToDeduct = 0;
                inventoryRepo.Update(inventory);
            }
            else
            {
                remainingQtyToDeduct -= inventory.Quantity;
                inventory.Quantity = 0;
                inventoryRepo.Update(inventory);
            }
        }

        // 2.6 Gieo mới thực thể RepairPartEntity
        // Đơn giá lấy giá bán niêm yết hiện tại của linh kiện (SalePrice)
        var part = new RepairPartEntity
        {
            RepairTicketId = ticket.Id,
            ProductVariantId = request.ProductVariantId,
            Quantity = request.Quantity,
            UnitPrice = variant.SalePrice
        };

        await partRepo.AddAsync(part, cancellationToken);

        // 2.7 Lưu thay đổi vào CSDL
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return part.Id;
    }

    /// <summary>
    /// 3. Xử lý cập nhật trạng thái phiếu sửa chữa (Linear Status Transition).
    /// </summary>
    public async Task<bool> Handle(UpdateRepairStatusCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        // 3.1 Tìm phiếu sửa chữa chính
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);
        }

        // Nếu trạng thái mới trùng trạng thái cũ, không cần xử lý, trả về true
        if (ticket.Status == request.Status)
        {
            // Nếu có cập nhật kỹ thuật viên hoặc tiền công thợ thì vẫn xử lý tiếp
            if (request.TechnicianId.HasValue && ticket.TechnicianId != request.TechnicianId.Value)
            {
                var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
                if (tech == null)
                {
                    throw new NotFoundException("Kỹ thuật viên", request.TechnicianId.Value);
                }
                ticket.TechnicianId = request.TechnicianId.Value;
                ticketRepo.Update(ticket);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            return true;
        }

        // 3.2 RÀNG BUỘC BR-SERV-01: Chuyển dịch trạng thái tuyến tính (chỉ đi lên, không đi lùi)
        bool isValidTransition = false;
        switch (ticket.Status)
        {
            case RepairTicketStatus.Received:
                isValidTransition = request.Status == RepairTicketStatus.WaitingForParts ||
                                    request.Status == RepairTicketStatus.Repairing ||
                                    request.Status == RepairTicketStatus.Completed ||
                                    request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.WaitingForParts:
                isValidTransition = request.Status == RepairTicketStatus.Repairing ||
                                    request.Status == RepairTicketStatus.Completed ||
                                    request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.Repairing:
                isValidTransition = request.Status == RepairTicketStatus.Completed ||
                                    request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.Completed:
            case RepairTicketStatus.Cancelled:
                // Trạng thái cuối (terminal states), không được chuyển đi đâu nữa
                isValidTransition = false;
                break;
        }

        if (!isValidTransition)
        {
            throw new BadRequestException($"Không được phép lùi trạng thái hoặc chuyển đổi trạng thái từ '{ticket.Status}' sang '{request.Status}'.");
        }

        // 3.3 Nếu cập nhật Kỹ thuật viên
        if (request.TechnicianId.HasValue)
        {
            var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
            if (tech == null)
            {
                throw new NotFoundException("Kỹ thuật viên", request.TechnicianId.Value);
            }
            ticket.TechnicianId = request.TechnicianId.Value;
        }

        // 3.4 Nếu có cập nhật tiền công thợ sửa (LaborCost)
        if (request.ActualCost.HasValue)
        {
            ticket.LaborCost = request.ActualCost.Value;
        }

        // 3.5 BẮT ĐẦU xử lý nghiệp vụ khi chuyển sang trạng thái Completed (Hoàn thành)
        if (request.Status == RepairTicketStatus.Completed)
        {
            // Lấy toàn bộ linh kiện thay thế đã sử dụng
            var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            decimal partsTotal = parts.Sum(p => p.UnitPrice * p.Quantity);

            // Tính toán lại tổng chi phí thực tế khách hàng phải trả (ActualCost = Tiền công + Tiền linh kiện)
            ticket.ActualCost = ticket.LaborCost + partsTotal;
            ticket.CompletedDate = DateTime.UtcNow;
        }

        // 3.6 BẮT ĐẦU xử lý nghiệp vụ khi chuyển sang trạng thái Cancelled (Hủy phiếu sửa chữa)
        if (request.Status == RepairTicketStatus.Cancelled)
        {
            // HOÀN TRẢ linh kiện thay thế về kho hàng của chi nhánh (nếu trước đó đã lỡ xuất linh kiện)
            var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            if (parts.Any())
            {
                var receivedUser = await userRepo.GetByIdAsync(ticket.ReceivedById, cancellationToken);
                if (receivedUser != null)
                {
                    var branchId = receivedUser.BranchId;
                    var branchWarehouses = await warehouseRepo.FindAsync(w => w.BranchId == branchId && !w.IsDeleted, cancellationToken);
                    var warehouseIds = branchWarehouses.OrderByDescending(w => w.CreatedAt).Select(w => w.Id).ToList();

                    if (warehouseIds.Any())
                    {
                        var targetWarehouseId = warehouseIds.First(); // Trả về kho đầu tiên của chi nhánh

                        foreach (var part in parts)
                        {
                            var inventories = await inventoryRepo.FindAsync(
                                inv => inv.WarehouseId == targetWarehouseId && inv.ProductVariantId == part.ProductVariantId, 
                                cancellationToken
                            );
                            var inventory = inventories.FirstOrDefault();

                            if (inventory != null)
                            {
                                inventory.Quantity += part.Quantity;
                                inventoryRepo.Update(inventory);
                            }
                            else
                            {
                                // Nếu chưa có bản ghi tồn kho ở kho này, tạo mới
                                var newInventory = new InventoryEntity
                                {
                                    WarehouseId = targetWarehouseId,
                                    ProductVariantId = part.ProductVariantId,
                                    Quantity = part.Quantity,
                                    MinimumStock = 0
                                };
                                await inventoryRepo.AddAsync(newInventory, cancellationToken);
                            }
                            
                            // Đánh dấu linh kiện đã bị xóa (soft delete) do hủy phiếu sửa
                            partRepo.Remove(part);
                        }
                    }
                }
            }
            
            ticket.ActualCost = 0;
            ticket.CompletedDate = DateTime.UtcNow;
        }

        // 3.7 Cập nhật trạng thái phiếu
        ticket.Status = request.Status;
        ticketRepo.Update(ticket);

        // 3.8 Ghi nhận lịch sử trạng thái
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = request.Status.ToString(),
            Note = request.Note ?? $"Hệ thống tự động chuyển trạng thái phiếu sang {request.Status}."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 3.9 Lưu tất cả thay đổi
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// 4. Xử lý xóa phiếu sửa chữa (chỉ cho phép ở trạng thái Received và chưa có linh kiện).
    /// </summary>
    public async Task<bool> Handle(DeleteRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();

        // 4.1 Tìm phiếu sửa chữa chính
        var ticket = await ticketRepo.GetByIdAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.Id);
        }

        // 4.2 Kiểm tra ràng buộc xóa
        if (ticket.Status != RepairTicketStatus.Received)
        {
            throw new BadRequestException($"Không thể xóa phiếu sửa chữa ở trạng thái '{ticket.Status}'. Chỉ cho phép xóa khi ở trạng thái 'Received'.");
        }

        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        if (parts.Any())
        {
            throw new BadRequestException("Không thể xóa phiếu sửa chữa đã phát sinh linh kiện thay thế.");
        }

        // 4.3 Thực hiện xóa mềm phiếu sửa chữa
        ticketRepo.Remove(ticket);

        // 4.4 Lưu thay đổi
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
