using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Repair.Commands;
using PSP.Domain.Common.Constants;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Repair.Handlers;

/// <summary>
/// BÃ¡Â»â„¢ xÃ¡Â»Â­ lÃƒÂ½ cÃƒÂ¡c LÃ¡Â»â€¡nh (Commands) cÃ¡Â»Â§a PhÃƒÂ¢n hÃ¡Â»â€¡ DÃ¡Â»â€¹ch vÃ¡Â»Â¥ - SÃ¡Â»Â­a chÃ¡Â»Â¯a (Module 15).
/// 
/// DÃƒÂ nh cho ngÃ†Â°Ã¡Â»Âi mÃ¡Â»â€ºi hÃ¡Â»Âc vÃƒÂ  trÃƒÂ¬nh Ã„â€˜Ã¡Â»â„¢ dÃ†Â°Ã¡Â»â€ºi junior:
/// - LÃ¡Â»â€ºp nÃƒÂ y hiÃ¡Â»â€¡n thÃ¡Â»Â±c logic tÃ¡ÂºÂ¡o phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a, xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n tÃ¡Â»Â« kho chi nhÃƒÂ¡nh vÃƒÂ  cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i sÃ¡Â»Â­a chÃ¡Â»Â¯a.
/// - TuÃƒÂ¢n thÃ¡Â»Â§ nghiÃƒÂªm ngÃ¡ÂºÂ·t BUSINESS_RULE_AI:
///   1. LuÃƒÂ¢n chuyÃ¡Â»Æ’n trÃ¡ÂºÂ¡ng thÃƒÂ¡i chÃ¡Â»â€° Ã„â€˜i theo chiÃ¡Â»Âu tiÃ¡ÂºÂ¿n (khÃƒÂ´ng quay lÃƒÂ¹i).
///   2. TÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng tÃƒÂ­nh toÃƒÂ¡n lÃ¡ÂºÂ¡i tÃ¡Â»â€¢ng tiÃ¡Â»Ân khi hoÃƒÂ n thÃƒÂ nh sÃ¡Â»Â­a chÃ¡Â»Â¯a (ActualCost = LaborCost + PartsTotal).
///   3. KiÃ¡Â»Æ’m tra vÃƒÂ  trÃ¡Â»Â« tÃ¡Â»â€œn kho vÃ¡ÂºÂ­t lÃƒÂ½ tÃ¡ÂºÂ¡i kho cÃ¡Â»Â§a chi nhÃƒÂ¡nh tiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n khi xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n.
///   4. HoÃƒÂ n trÃ¡ÂºÂ£ tÃ¡Â»â€œn kho vÃ¡ÂºÂ­t lÃƒÂ½ cÃ¡Â»Â§a linh kiÃ¡Â»â€¡n nÃ¡ÂºÂ¿u phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a bÃ¡Â»â€¹ hÃ¡Â»Â§y.
/// </summary>
public class RepairCommandHandlers :
    IRequestHandler<CreateRepairTicketCommand, Guid>,
    IRequestHandler<AddRepairPartCommand, Guid>,
    IRequestHandler<UpdateRepairStatusCommand, bool>,
    IRequestHandler<DeleteRepairTicketCommand, bool>,
    IRequestHandler<UpdateRepairPartStatusCommand, bool>,
    IRequestHandler<ReturnRepairPartCommand, bool>,
    IRequestHandler<WriteOffRepairPartCommand, bool>,
    IRequestHandler<CancelRepairTicketCommand, bool>,
    IRequestHandler<AssignTechnicianCommand, bool>,
    IRequestHandler<StartDiagnosisCommand, bool>,
    IRequestHandler<SubmitDiagnosisCommand, bool>,
    IRequestHandler<ApproveRepairCommand, bool>,
    IRequestHandler<RejectRepairCommand, bool>,
    IRequestHandler<UseRepairPartCommand, bool>,
    IRequestHandler<CompleteRepairCommand, bool>,
    IRequestHandler<DeliverRepairCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IScopeContextService _scopeContext;
    private readonly INotificationService? _notificationService;

    public RepairCommandHandlers(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IIdempotencyService idempotencyService,
        IScopeContextService? scopeContext = null,
        INotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _idempotencyService = idempotencyService;
        _scopeContext = scopeContext ?? new ScopeContextService(currentUserService);
        _notificationService = notificationService;
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

        // Fail-Closed Branch Isolation: Admin/Owner có thể chọn chi nhánh (request.BranchId), nhân viên thường bắt buộc theo chi nhánh của mình
        var branchId = _scopeContext.IsEnterpriseScope && request.BranchId.HasValue && request.BranchId.Value != Guid.Empty
            ? request.BranchId.Value
            : _scopeContext.GetRequiredBranchId();

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

        // 1.6 Khởi tạo phiếu sửa chữa: Nếu chưa chọn KTV thì trạng thái ban đầu là PendingAssignment, nếu đã có KTV là Received
        var hasTech = request.TechnicianId.HasValue && request.TechnicianId.Value != Guid.Empty;
        var initialStatus = hasTech ? RepairTicketStatus.Received : RepairTicketStatus.PendingAssignment;

        var ticket = new RepairTicketEntity
        {
            BranchId = branchId,
            CustomerId = request.CustomerId,
            ProductVariantId = request.ProductVariantId,
            Imei = string.IsNullOrWhiteSpace(request.Imei) ? null : request.Imei.Trim(),
            ReceivedById = employeeId,
            TechnicianId = hasTech ? request.TechnicianId : null,
            Code = ticketCode,
            Status = initialStatus,
            ProblemDescription = request.ProblemDescription.Trim(),
            ExteriorCondition = string.IsNullOrWhiteSpace(request.ExteriorCondition) ? null : request.ExteriorCondition.Trim(),
            CustomModelName = string.IsNullOrWhiteSpace(request.CustomModelName) ? null : request.CustomModelName.Trim(),
            EstimatedCost = request.EstimatedCost ?? 0,
            ActualCost = 0,
            LaborCost = 0,
            ReceivedDate = DateTime.UtcNow,
            IsTest = request.IsTest
        };

        await ticketRepo.AddAsync(ticket, cancellationToken);

        // 1.7 Ghi nhận lịch sử trạng thái đầu tiên
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = initialStatus.ToString(),
            Note = hasTech
                ? "Tiếp nhận thiết bị lỗi từ khách hàng và phân công kỹ thuật viên."
                : "Tiếp nhận thiết bị lỗi từ khách hàng (Chờ quản lý phân công kỹ thuật viên)."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 1.8 Lưu thay đổi vào CSDL
        _idempotencyService.AttachRecord(ticket.Id);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Gửi thông báo cho Quản lý chi nhánh nếu phiếu chưa phân công kỹ thuật viên
        if (initialStatus == RepairTicketStatus.PendingAssignment && _notificationService != null)
        {
            var devName = ticket.CustomModelName ?? variant.Name;
            var title = $"[Điều phối sửa chữa] Phiếu mới {ticketCode} cần phân công";
            var content = $"Thiết bị {devName} (IMEI: {ticket.Imei ?? "Chưa có"}) vừa được tiếp nhận. Đang chờ quản lý phân công kỹ thuật viên.";
            await NotifyManagersAsync(branchId, title, content, cancellationToken);
        }

        return ticket.Id;
    }

    /// <summary>
    /// 2. XÃ¡Â»Â­ lÃƒÂ½ xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n tÃ¡Â»Â« kho chi nhÃƒÂ¡nh Ã„â€˜Ã¡Â»Æ’ lÃ¡ÂºÂ¯p rÃƒÂ¡p/thay thÃ¡ÂºÂ¿.
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

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

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

        var branchId = ticket.BranchId ?? receivedUser.BranchId;

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
        if (request.IssueImmediately)
        {
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
        }

        // 2.6 Gieo mới thực thể RepairPartEntity
        // Đơn giá lấy giá bán niêm yết hiện tại của linh kiện (SalePrice)
        var part = new RepairPartEntity
        {
            RepairTicketId = ticket.Id,
            ProductVariantId = request.ProductVariantId,
            Quantity = request.Quantity,
            UnitPrice = variant.SalePrice,
            ImeiId = request.ImeiId,
            Status = request.IssueImmediately ? RepairPartStatus.Issued : RepairPartStatus.Reserved
        };

        await partRepo.AddAsync(part, cancellationToken);

        if (request.IssueImmediately)
        {
            var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
            var txn = new InventoryTransactionEntity
            {
                WarehouseId = warehouseIds.First(),
                ProductVariantId = request.ProductVariantId,
                Type = InventoryTransactionType.REPAIR_ISSUE,
                QuantityChange = -request.Quantity,
                ReferenceId = part.Id,
                ActorId = receivedUser.Id
            };
            await transactionRepo.AddAsync(txn, cancellationToken);

            if (part.ImeiId.HasValue)
            {
                var imeiRepo = _unitOfWork.Repository<ImeiEntity>();
                var imeiEntity = await imeiRepo.GetByIdAsync(part.ImeiId.Value, cancellationToken);
                if (imeiEntity != null)
                {
                    imeiEntity.Status = ImeiStatus.Repairing;
                    imeiRepo.Update(imeiEntity);
                }
            }
        }

        // 2.7 Lưu thay đổi vào CSDL
        try
        {
            _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("CK_Inventory_Quantity") == true)
                throw new ConflictException("Kho kh\u00f4ng \u0111\u1ee7 s\u1ed1 l\u01b0\u1ee3ng.");
            if (ex.InnerException?.Message.Contains("IX_RepairParts_ImeiId") == true)
                throw new ConflictException("IMEI \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng.");
            throw;
        }

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

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        // NÃ¡ÂºÂ¿u trÃ¡ÂºÂ¡ng thÃƒÂ¡i mÃ¡Â»â€ºi trÃƒÂ¹ng trÃ¡ÂºÂ¡ng thÃƒÂ¡i cÃ…Â©, khÃƒÂ´ng cÃ¡ÂºÂ§n xÃ¡Â»Â­ lÃƒÂ½, trÃ¡ÂºÂ£ vÃ¡Â»Â true
        if (ticket.Status == request.Status)
        {
            // NÃ¡ÂºÂ¿u cÃƒÂ³ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t kÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn hoÃ¡ÂºÂ·c tiÃ¡Â»Ân cÃƒÂ´ng thÃ¡Â»Â£ thÃƒÂ¬ vÃ¡ÂºÂ«n xÃ¡Â»Â­ lÃƒÂ½ tiÃ¡ÂºÂ¿p
            if (request.TechnicianId.HasValue && ticket.TechnicianId != request.TechnicianId.Value)
            {
                var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
                if (tech == null)
                {
                    throw new NotFoundException("Kỹ thuật viên", request.TechnicianId.Value);
                }
                ticket.TechnicianId = request.TechnicianId.Value;
                if (ticket.Status == RepairTicketStatus.PendingAssignment)
                {
                    ticket.Status = RepairTicketStatus.Received;
                }
                ticketRepo.Update(ticket);
                _idempotencyService.AttachRecord(true);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            return true;
        }

        // 3.2 RÀNG BUỘC VÒNG ĐỜI (Section 2)
        bool isValidTransition = false;
        switch (ticket.Status)
        {
            case RepairTicketStatus.PendingAssignment:
                isValidTransition = request.Status == RepairTicketStatus.Received 
                    || request.Status == RepairTicketStatus.Diagnosing 
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.Received:
                isValidTransition = request.Status == RepairTicketStatus.Diagnosing 
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.Diagnosing:
                isValidTransition = request.Status == RepairTicketStatus.WaitingApproval 
                    || request.Status == RepairTicketStatus.WaitingForParts 
                    || request.Status == RepairTicketStatus.Repairing 
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.WaitingApproval:
                isValidTransition = request.Status == RepairTicketStatus.Repairing 
                    || request.Status == RepairTicketStatus.WaitingForParts
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.WaitingForParts:
                isValidTransition = request.Status == RepairTicketStatus.Repairing 
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.Repairing:
                isValidTransition = request.Status == RepairTicketStatus.WaitingQC 
                    || request.Status == RepairTicketStatus.WaitingForParts 
                    || request.Status == RepairTicketStatus.Completed 
                    || request.Status == RepairTicketStatus.Cancelled;
                break;
            case RepairTicketStatus.WaitingQC:
                isValidTransition = request.Status == RepairTicketStatus.Repairing // QC không đạt
                    || request.Status == RepairTicketStatus.Completed; // QC đạt
                break;
            case RepairTicketStatus.Completed:
                isValidTransition = request.Status == RepairTicketStatus.WaitingPickup;
                break;
            case RepairTicketStatus.WaitingPickup:
                isValidTransition = request.Status == RepairTicketStatus.Delivered;
                break;
            default:
                isValidTransition = false;
                break;
        }

        if (!isValidTransition)
        {
            throw new ConflictException($"Không được phép chuyển đổi trạng thái từ '{ticket.Status}' sang '{request.Status}' theo quy trình nghiệp vụ.");
        }

        // 3.3 NÃ¡ÂºÂ¿u cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn
        // 3.3 Cập nhật Kỹ thuật viên
        if (request.TechnicianId.HasValue)
        {
            var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
            if (tech == null)
            {
                throw new NotFoundException("Kỹ thuật viên", request.TechnicianId.Value);
            }
            ticket.TechnicianId = request.TechnicianId.Value;
        }

        // 3.4 Bỏ qua cập nhật tiền công thợ sửa (đã chuyển sang module khác hoặc sẽ cập nhật riêng)

        // 3.5 BẮT ĐẦU xử lý nghiệp vụ khi chuyển sang trạng thái Completed (Hoàn thành)
        if (request.Status == RepairTicketStatus.Completed)
        {
            // Lấy toàn bộ linh kiện thay thế đã sử dụng (không tính linh kiện đã hoàn trả)
            var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            decimal partsTotal = parts.Where(p => p.Status == RepairPartStatus.Installed || p.Status == RepairPartStatus.Issued).Sum(p => p.UnitPrice * p.Quantity);

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
        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
    /// 4. XÃ¡Â»Â­ lÃƒÂ½ xÃƒÂ³a phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a (chÃ¡Â»â€° cho phÃƒÂ©p Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i Received vÃƒÂ  chÃ†Â°a cÃƒÂ³ linh kiÃ¡Â»â€¡n).
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

        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

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
        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
    /// <summary>
    /// 5. Xử lý Update trạng thái linh kiện (Issue, Install)
    /// </summary>
    public async Task<bool> Handle(UpdateRepairPartStatusCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiÃ¡Â»â€¡n", request.RepairPartId);

        // Concurrency token check
        if (!part.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("ThÃƒÂ´ng tin linh kiÃ¡Â»â€¡n Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ thay Ã„â€˜Ã¡Â»â€¢i bÃ¡Â»Å¸i ngÃ†Â°Ã¡Â» i khÃƒÂ¡c. Vui lÃƒÂ²ng tÃ¡ÂºÂ£i lÃ¡ÂºÂ¡i trang.");
        }

        // Logic Issue
        if (request.Status == RepairPartStatus.Issued && part.Status == RepairPartStatus.Reserved)
        {
            var warehouses = await warehouseRepo.FindAsync(w => w.BranchId == ticket.BranchId && !w.IsDeleted, cancellationToken);
            var warehouseId = warehouses.FirstOrDefault()?.Id;
            if (warehouseId == null) throw new BadRequestException("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y kho hÃƒÂ ng cÃ¡Â»Â§a chi nhÃƒÂ¡nh Ã„â€˜Ã¡Â»Æ’ xuÃ¡ÂºÂ¥t.");

            var inventory = (await inventoryRepo.FindAsync(i => i.WarehouseId == warehouseId.Value && i.ProductVariantId == part.ProductVariantId, cancellationToken)).FirstOrDefault();
            if (inventory == null || inventory.Quantity < part.Quantity)
            {
                throw new ConflictException("Kho khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§ sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng.");
            }

            inventory.Quantity -= part.Quantity;
            inventoryRepo.Update(inventory);

            var txn = new InventoryTransactionEntity
            {
                WarehouseId = warehouseId.Value,
                ProductVariantId = part.ProductVariantId,
                Type = InventoryTransactionType.REPAIR_ISSUE,
                QuantityChange = -part.Quantity,
                ReferenceId = part.Id,
                ActorId = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty
            };
            await transactionRepo.AddAsync(txn, cancellationToken);
            
            part.Status = RepairPartStatus.Issued;
        }
        // Logic Install
        else if (request.Status == RepairPartStatus.Installed && part.Status == RepairPartStatus.Issued)
        {
            part.Status = RepairPartStatus.Installed;
        }
        else
        {
            throw new ConflictException($"KhÃ´ng thá»ƒ chuyá»ƒn tráº¡ng thÃ¡i linh kiá»‡n tá»« {part.Status} sang {request.Status}.");
        }

        partRepo.Update(part);
        
        try
        {
            _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("CK_Inventory_Quantity") == true)
                throw new ConflictException("Kho kh\u00f4ng \u0111\u1ee7 s\u1ed1 l\u01b0\u1ee3ng.");
            if (ex.InnerException?.Message.Contains("IX_RepairParts_ImeiId") == true)
                throw new ConflictException("IMEI \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng.");
            throw;
        }

        return true;
    }

    /// <summary>
    /// 6. XÃ¡Â»Â­ lÃƒÂ½ Return linh kiÃ¡Â»â€¡n
    /// </summary>
    public async Task<bool> Handle(ReturnRepairPartCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiện", request.RepairPartId);

        if (request.RowVersion != null && request.RowVersion.Length > 0 && part.RowVersion != null && part.RowVersion.Length > 0 && !part.RowVersion.SequenceEqual(request.RowVersion))
            throw new ConflictException("Thông tin linh kiện đã bị thay đổi.");

        if (part.Status != RepairPartStatus.Issued && part.Status != RepairPartStatus.Installed && part.Status != RepairPartStatus.Reserved)
            throw new ConflictException($"Không thể Return linh kiện đang ở trạng thái {part.Status}.");

        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var partVariant = await variantRepo.GetByIdAsync(part.ProductVariantId, cancellationToken);
        var partName = partVariant?.Name ?? "Linh kiện";

        if (part.Status == RepairPartStatus.Reserved)
        {
            // Bỏ Reserved, không làm thay đổi tồn kho
            part.Status = RepairPartStatus.Returned;
            partRepo.Update(part);
            
            if (part.ImeiId.HasValue)
            {
                var imei = await imeiRepo.GetByIdAsync(part.ImeiId.Value, cancellationToken);
                if (imei != null) { imei.Status = ImeiStatus.InStock; imeiRepo.Update(imei); }
            }
        }
        else
        {
            // Đã Issue hoặc Install => Cộng lại tồn kho
            var warehouses = await warehouseRepo.FindAsync(w => w.BranchId == ticket.BranchId && !w.IsDeleted, cancellationToken);
            var warehouseId = warehouses.FirstOrDefault()?.Id;
            if (warehouseId == null) throw new BadRequestException("Không tìm thấy kho.");

            var inventory = (await inventoryRepo.FindAsync(i => i.WarehouseId == warehouseId.Value && i.ProductVariantId == part.ProductVariantId, cancellationToken)).FirstOrDefault();
            if (inventory != null)
            {
                inventory.Quantity += part.Quantity;
                inventoryRepo.Update(inventory);
            }
            else
            {
                inventory = new InventoryEntity { WarehouseId = warehouseId.Value, ProductVariantId = part.ProductVariantId, Quantity = part.Quantity };
                await inventoryRepo.AddAsync(inventory, cancellationToken);
            }

            var txn = new InventoryTransactionEntity
            {
                WarehouseId = warehouseId.Value,
                ProductVariantId = part.ProductVariantId,
                Type = InventoryTransactionType.REPAIR_RETURN,
                QuantityChange = part.Quantity,
                ReferenceId = part.Id,
                ActorId = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty
            };
            await transactionRepo.AddAsync(txn, cancellationToken);

            part.Status = RepairPartStatus.Returned;
            partRepo.Update(part);
            
            if (part.ImeiId.HasValue)
            {
                var imei = await imeiRepo.GetByIdAsync(part.ImeiId.Value, cancellationToken);
                if (imei != null) { imei.Status = ImeiStatus.InStock; imeiRepo.Update(imei); }
            }
        }

        // Tự động tính toán lại ActualCost nếu đã có chi phí
        var remainingParts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted && p.Id != part.Id, cancellationToken);
        var remainingPartsCost = remainingParts.Where(p => p.Status == RepairPartStatus.Installed || p.Status == RepairPartStatus.Issued).Sum(p => p.UnitPrice * p.Quantity);
        if (ticket.ActualCost.HasValue && ticket.ActualCost > 0)
        {
            ticket.ActualCost = ticket.LaborCost + remainingPartsCost;
            ticketRepo.Update(ticket);
        }

        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Part Returned", 
            $"Đã gỡ bỏ linh kiện '{partName}' (SL: {part.Quantity}) và hoàn trả lại kho.", 
            cancellationToken: cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 7. Xử lý WriteOff linh kiện
    /// </summary>
    public async Task<bool> Handle(WriteOffRepairPartCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiện", request.RepairPartId);

        if (!part.RowVersion.SequenceEqual(request.RowVersion))
            throw new ConflictException("Thông tin linh kiện đã bị thay đổi.");

        if (part.Status != RepairPartStatus.Issued && part.Status != RepairPartStatus.Installed)
            throw new ConflictException($"Chỉ có thể WriteOff linh kiện đã Issue hoặc Install. Trạng thái hiện tại: {part.Status}.");

        var warehouses = await warehouseRepo.FindAsync(w => w.BranchId == ticket.BranchId && !w.IsDeleted, cancellationToken);
        var warehouseId = warehouses.FirstOrDefault()?.Id ?? Guid.Empty;

        var txn = new InventoryTransactionEntity
        {
            WarehouseId = warehouseId,
            ProductVariantId = part.ProductVariantId,
            Type = InventoryTransactionType.REPAIR_WRITEOFF,
            QuantityChange = 0,
            ReferenceId = part.Id,
            ActorId = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty
        };
        await transactionRepo.AddAsync(txn, cancellationToken);

        part.Status = RepairPartStatus.WriteOff;
        part.CostAtWriteOff = part.UnitPrice * part.Quantity;
        partRepo.Update(part);

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await NotifyManagersAsync(ticket.BranchId,
            $"[Hao hụt linh kiện] Ca {ticket.Code} phát sinh Write-Off",
            $"Linh kiện đã bị xóa sổ do: '{request.Reason}'. Chi phí hao hụt: {part.CostAtWriteOff:N0} đ.",
            cancellationToken);

        return true;
    }

    /// <summary>
    /// 8. Xử lý Hủy phiếu sửa chữa kèm Dispositions
    /// </summary>
    public async Task<bool> Handle(CancelRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);
        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Cancelled)
            throw new ConflictException("Không thể hủy phiếu đã hoàn thành hoặc đã hủy.");

        var isManagerOrAdmin = _currentUserService != null && (
            _currentUserService.IsInRole(CanonicalRoles.Owner) ||
            _currentUserService.IsInRole(CanonicalRoles.Admin) ||
            _currentUserService.IsInRole(CanonicalRoles.Manager));
        var isSales = _currentUserService != null && _currentUserService.IsInRole(CanonicalRoles.Sales) && !isManagerOrAdmin;

        if (isSales)
        {
            if (ticket.Status != RepairTicketStatus.PendingAssignment && ticket.Status != RepairTicketStatus.Received)
            {
                throw new ForbiddenException("Nhân viên bán hàng chỉ có thể hủy phiếu khi thiết bị mới ở bước tiếp nhận ban đầu. Ca sửa chữa đang trong tiến trình kỹ thuật, vui lòng liên hệ Kỹ thuật viên hoặc Quản lý.");
            }
        }

        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        if (isSales && parts.Any(p => p.Status == RepairPartStatus.Issued || p.Status == RepairPartStatus.Installed))
        {
            throw new ForbiddenException("Phiếu sửa chữa đã xuất linh kiện kỹ thuật, nhân viên bán hàng không thể hủy. Vui lòng liên hệ Kỹ thuật viên hoặc Quản lý.");
        }
        foreach (var part in parts)
        {
            if (part.Status == RepairPartStatus.Reserved)
            {
                await Handle(new ReturnRepairPartCommand(ticket.Id, part.Id, part.RowVersion), cancellationToken);
            }
            else if (part.Status == RepairPartStatus.Issued || part.Status == RepairPartStatus.Installed)
            {
                var disp = request.Dispositions?.FirstOrDefault(d => d.RepairPartId == part.Id);
                if (disp == null) 
                    throw new BadRequestException($"Linh kiện {part.Id} đang ở trạng thái {part.Status} cần quyết định xử lý (Return hoặc WriteOff) khi hủy phiếu.");
                
                if (disp.Disposition == RepairPartStatus.Returned)
                    await Handle(new ReturnRepairPartCommand(ticket.Id, part.Id, part.RowVersion), cancellationToken);
                else if (disp.Disposition == RepairPartStatus.WriteOff)
                    await Handle(new WriteOffRepairPartCommand(ticket.Id, part.Id, disp.Reason ?? "Hủy phiếu", part.RowVersion), cancellationToken);
                else
                    throw new BadRequestException("Quyết định xử lý linh kiện không hợp lệ.");
            }
        }

        ticket.Status = RepairTicketStatus.Cancelled;
        ticket.ActualCost = 0;
        ticket.CompletedDate = DateTime.UtcNow;
        ticketRepo.Update(ticket);

        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = ticket.Status.ToString(),
            Note = request.Note ?? "Hủy phiếu sửa chữa."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await NotifyManagersAsync(ticket.BranchId,
            $"[Hủy ca sửa chữa] Ca {ticket.Code} đã bị hủy",
            $"Phiếu sửa chữa {ticket.Code} đã bị hủy. Lý do: '{request.Note ?? "Hủy phiếu"}'. Vui lòng kiểm tra đối soát hoàn cọc (nếu có).",
            cancellationToken);

        return true;
    }

    /// <summary>
    /// 9. Phân công Kỹ thuật viên phụ trách sửa chữa (Section 7)
    /// </summary>
    public async Task<bool> Handle(AssignTechnicianCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Delivered || ticket.Status == RepairTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Không thể phân công kỹ thuật viên cho phiếu ở trạng thái '{ticket.Status}'.");
        }

        // Kiểm tra phân quyền:
        // Nếu là Technician thuần túy: Chỉ được phép tự nhận việc (request.TechnicianId == CurrentUserId)
        // Nếu là Manager, Admin, Owner: Được phép gán cho bất kỳ KTV nào thuộc chi nhánh
        if (_currentUserService != null && _currentUserService.IsInRole(CanonicalRoles.Technician) &&
            !_currentUserService.IsInRole(CanonicalRoles.Manager) &&
            !_currentUserService.IsInRole(CanonicalRoles.Admin) &&
            !_currentUserService.IsInRole(CanonicalRoles.Owner))
        {
            if (string.IsNullOrWhiteSpace(_currentUserService.UserId) ||
                !Guid.TryParse(_currentUserService.UserId, out var currentUserId) ||
                request.TechnicianId != currentUserId)
            {
                throw new ForbiddenException("Kỹ thuật viên chỉ có thể tự nhận phiếu sửa chữa cho chính mình, không có quyền phân công cho người khác.");
            }

            // Nếu phiếu đã được nhận bởi một KTV khác, không cho phép nhận đè / cướp đơn
            if (ticket.TechnicianId.HasValue && ticket.TechnicianId.Value != Guid.Empty && ticket.TechnicianId.Value != currentUserId)
            {
                throw new ConflictException("Phiếu sửa chữa này đã được tiếp nhận bởi kỹ thuật viên khác. Vui lòng liên hệ Quản lý nếu cần điều phối lại.");
            }
        }

        var tech = await userRepo.GetByIdAsync(request.TechnicianId, cancellationToken);
        if (tech == null) throw new NotFoundException("Kỹ thuật viên", request.TechnicianId);

        // Kiểm tra phạm vi chi nhánh của kỹ thuật viên
        if (!_scopeContext.IsEnterpriseScope && ticket.BranchId.HasValue && tech.BranchId != Guid.Empty && tech.BranchId != ticket.BranchId.Value)
        {
            throw new BadRequestException("Kỹ thuật viên không thuộc cùng chi nhánh với phiếu sửa chữa.");
        }

        ticket.TechnicianId = request.TechnicianId;
        
        // Nếu đang ở trạng thái PendingAssignment (Chờ phân công), tự động chuyển sang Received (Tiếp nhận)
        if (ticket.Status == RepairTicketStatus.PendingAssignment)
        {
            ticket.Status = RepairTicketStatus.Received;
        }

        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(historyRepo, ticket.Id, ticket.Status.ToString(), "Technician Assigned", $"Phân công cho kỹ thuật viên {tech.FullName} ({tech.Username}).", cancellationToken: cancellationToken);

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 10. Bắt đầu chẩn đoán thiết bị (Section 5: Received -> Diagnosing)
    /// </summary>
    public async Task<bool> Handle(StartDiagnosisCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        if (ticket.Status != RepairTicketStatus.Received)
        {
            throw new ConflictException($"Chỉ có thể bắt đầu chẩn đoán khi phiếu ở trạng thái Received. Trạng thái hiện tại: {ticket.Status}.");
        }

        ticket.Status = RepairTicketStatus.Diagnosing;
        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(historyRepo, ticket.Id, ticket.Status.ToString(), "Diagnosis Started", "Kỹ thuật viên bắt đầu tiến hành kiểm tra và chẩn đoán tình trạng máy.", cancellationToken: cancellationToken);

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 11. Gửi kết quả chẩn đoán và phương án sửa chữa (Section 5)
    /// </summary>
    public async Task<bool> Handle(SubmitDiagnosisCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        if (ticket.Status != RepairTicketStatus.Diagnosing)
        {
            throw new ConflictException($"Chỉ có thể nộp chẩn đoán khi phiếu ở trạng thái Diagnosing. Trạng thái hiện tại: {ticket.Status}.");
        }

        ticket.DiagnosisRootCause = request.RootCause.Trim();
        ticket.DiagnosisProposedSolution = request.ProposedSolution.Trim();
        ticket.TechnicalNotes = request.TechnicalNotes?.Trim();
        ticket.EstimatedDays = request.EstimatedDays;
        ticket.DiagnosedAt = DateTime.UtcNow;
        if (Guid.TryParse(_currentUserService.UserId, out var diagId))
        {
            ticket.DiagnosedById = diagId;
        }

        if (request.EstimatedCost.HasValue)
        {
            ticket.EstimatedCost = request.EstimatedCost.Value;
        }

        // Phân nhánh quy trình theo Section 2 & Section 5
        if (request.RequiresCustomerApproval)
        {
            ticket.Status = RepairTicketStatus.WaitingApproval;
            ticket.CustomerApprovalStatus = "Pending";
            await NotifyManagersAsync(ticket.BranchId,
                $"[Chờ duyệt báo giá] Ca {ticket.Code} cần duyệt phương án",
                $"Thiết bị {ticket.CustomModelName ?? "Điện thoại"}: KTV nộp chẩn đoán '{request.RootCause}', phương án '{request.ProposedSolution}', chi phí ước tính {ticket.EstimatedCost:N0} đ. Đang chờ phê duyệt.",
                cancellationToken);
        }
        else if (request.WaitingForParts)
        {
            ticket.Status = RepairTicketStatus.WaitingForParts;
            await NotifyManagersAsync(ticket.BranchId,
                $"[Thiếu linh kiện] Ca {ticket.Code} cần bổ sung linh kiện",
                $"Thiết bị {ticket.CustomModelName ?? "Điện thoại"}: Phương án '{request.ProposedSolution}' thiếu linh kiện trong kho, cần quản lý kiểm tra điều chuyển hoặc nhập hàng.",
                cancellationToken);
        }
        else
        {
            ticket.Status = RepairTicketStatus.Repairing;
        }

        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Diagnosis Submitted", 
            $"Chẩn đoán: {request.RootCause}. Phương án: {request.ProposedSolution}.", 
            $"Chi phí ước tính: {ticket.EstimatedCost:N0} đ. Chuyển sang: {ticket.Status}.", 
            cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 12. Khách hàng phê duyệt sửa chữa (Section 6: WaitingApproval -> Repairing)
    /// </summary>
    public async Task<bool> Handle(ApproveRepairCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

        if (ticket.Status != RepairTicketStatus.WaitingApproval)
        {
            throw new ConflictException($"Phiếu không ở trạng thái WaitingApproval để thực hiện phê duyệt (Hiện tại: {ticket.Status}).");
        }

        ticket.CustomerApprovalStatus = "Approved";
        ticket.CustomerApprovedAt = DateTime.UtcNow;
        if (Guid.TryParse(_currentUserService.UserId, out var appUserId))
        {
            ticket.CustomerApprovedById = appUserId;
        }
        ticket.CustomerApprovalMethod = request.ApprovalMethod.Trim();
        ticket.CustomerApprovedAmount = request.ApprovedAmount;
        ticket.CustomerApprovalNote = request.Note?.Trim();

        // Chuyển sang Repairing
        ticket.Status = RepairTicketStatus.Repairing;
        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Customer Approved", 
            $"Khách hàng đồng ý sửa qua {request.ApprovalMethod}. Số tiền duyệt: {request.ApprovedAmount:N0} đ.", 
            request.Note, 
            cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 13. Khách hàng từ chối sửa chữa (Section 6: WaitingApproval -> Cancelled)
    /// </summary>
    public async Task<bool> Handle(RejectRepairCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

        if (ticket.Status != RepairTicketStatus.WaitingApproval)
        {
            throw new ConflictException($"Phiếu không ở trạng thái WaitingApproval để từ chối sửa chữa (Hiện tại: {ticket.Status}).");
        }

        ticket.CustomerApprovalStatus = "Rejected";
        ticket.CustomerApprovalNote = request.Reason?.Trim();
        ticket.Status = RepairTicketStatus.Cancelled;
        ticket.CompletedDate = DateTime.UtcNow;

        // Giải phóng các linh kiện đang Reserved
        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        foreach (var part in parts)
        {
            if (part.Status == RepairPartStatus.Reserved)
            {
                part.Status = RepairPartStatus.Returned;
                partRepo.Update(part);
            }
        }

        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Customer Rejected", 
            $"Khách hàng từ chối sửa chữa. Lý do: {request.Reason ?? "Không có"}", 
            cancellationToken: cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 14. Sử dụng / Lắp ráp linh kiện vào máy (Section 8: Reserved/Issued -> Installed)
    /// </summary>
    public async Task<bool> Handle(UseRepairPartCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        if (ticket.Status != RepairTicketStatus.Repairing)
        {
            throw new ConflictException($"Chỉ có thể lắp ráp linh kiện khi phiếu ở trạng thái Repairing. Hiện tại: {ticket.Status}.");
        }

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiện", request.RepairPartId);

        if (!part.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin linh kiện đã bị thay đổi bởi giao dịch khác.");
        }

        if (part.Status != RepairPartStatus.Reserved && part.Status != RepairPartStatus.Issued)
        {
            throw new ConflictException($"Không thể lắp ráp linh kiện đang ở trạng thái {part.Status}.");
        }

        // Nếu part đang Reserved, cần trừ tồn kho
        if (part.Status == RepairPartStatus.Reserved)
        {
            var warehouses = await warehouseRepo.FindAsync(w => w.BranchId == ticket.BranchId && !w.IsDeleted, cancellationToken);
            var warehouseId = warehouses.FirstOrDefault()?.Id;
            if (warehouseId == null) throw new BadRequestException("Không tìm thấy kho thuộc chi nhánh của phiếu sửa chữa.");

            var inventory = (await inventoryRepo.FindAsync(i => i.WarehouseId == warehouseId.Value && i.ProductVariantId == part.ProductVariantId, cancellationToken)).FirstOrDefault();
            if (inventory == null || inventory.Quantity < part.Quantity)
            {
                throw new ConflictException("Tồn kho không đủ để xuất linh kiện vào máy.");
            }

            inventory.Quantity -= part.Quantity;
            inventoryRepo.Update(inventory);

            var txn = new InventoryTransactionEntity
            {
                WarehouseId = warehouseId.Value,
                ProductVariantId = part.ProductVariantId,
                Type = InventoryTransactionType.REPAIR_ISSUE,
                QuantityChange = -part.Quantity,
                ReferenceId = part.Id,
                ActorId = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty,
                CostSnapshot = part.UnitPrice
            };
            await transactionRepo.AddAsync(txn, cancellationToken);
        }

        part.Status = RepairPartStatus.Installed;
        partRepo.Update(part);

        // Kiểm tra nếu tất cả linh kiện đã được lắp và phiếu đang ở WaitingForParts
        var allParts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        if (ticket.Status == RepairTicketStatus.WaitingForParts && allParts.All(p => p.Status == RepairPartStatus.Installed || p.Status == RepairPartStatus.Returned))
        {
            ticket.Status = RepairTicketStatus.Repairing;
            ticketRepo.Update(ticket);
        }

        await AddAuditHistoryAsync(historyRepo, ticket.Id, ticket.Status.ToString(), "Part Used", $"Đã lắp ráp linh kiện vào thiết bị.", $"PartId: {part.Id}", cancellationToken);

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 15. Hoàn tất sửa chữa (Section 11: Repairing / WaitingQC -> Completed)
    /// </summary>
    public async Task<bool> Handle(CompleteRepairCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateTechnicianExecution(ticket.TechnicianId, ticket.BranchId);

        if (ticket.Status != RepairTicketStatus.WaitingQC && ticket.Status != RepairTicketStatus.Repairing && ticket.Status != RepairTicketStatus.Completed)
        {
            throw new ConflictException($"Không thể hoàn tất sửa chữa khi phiếu ở trạng thái {ticket.Status}. Cần ở trạng thái Repairing, WaitingQC hoặc Completed.");
        }

        // Section 11: Validate that no parts are left in Reserved status
        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        var unhandledParts = parts.Where(p => p.Status == RepairPartStatus.Reserved).ToList();
        if (unhandledParts.Any())
        {
            throw new ConflictException($"Không thể hoàn tất: Còn {unhandledParts.Count} linh kiện đang ở trạng thái Reserved chưa được xử lý (lắp ráp hoặc hoàn kho).");
        }

        // Section 11: Final Cost calculated from server data
        decimal installedPartsCost = parts.Where(p => p.Status == RepairPartStatus.Installed || p.Status == RepairPartStatus.Issued).Sum(p => p.UnitPrice * p.Quantity);
        ticket.ActualCost = ticket.LaborCost + installedPartsCost;
        ticket.CompletedDate = DateTime.UtcNow;
        ticket.Status = ticket.Status == RepairTicketStatus.Completed 
            ? RepairTicketStatus.WaitingPickup 
            : RepairTicketStatus.Completed;
        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Completed", 
            $"Hoàn tất sửa chữa thiết bị. Chi phí thực tế: {ticket.ActualCost:N0} đ (Tiền công: {ticket.LaborCost:N0} đ, Linh kiện: {installedPartsCost:N0} đ).", 
            request.CompletionNotes, 
            cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 16. Bàn giao thiết bị cho khách hàng (Section 12: Completed / WaitingPickup -> Delivered)
    /// </summary>
    public async Task<bool> Handle(DeliverRepairCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

        if (ticket.Status != RepairTicketStatus.WaitingPickup && ticket.Status != RepairTicketStatus.Completed)
        {
            throw new ConflictException($"Chỉ có thể bàn giao khi phiếu ở trạng thái Completed hoặc WaitingPickup. Hiện tại: {ticket.Status}.");
        }

        if (Guid.TryParse(_currentUserService.UserId, out var delUserId))
        {
            ticket.DeliveredById = delUserId;
        }
        ticket.DeliveredAt = DateTime.UtcNow;
        ticket.DeliveredToCustomerName = request.ReceiverName.Trim();
        ticket.DeliveryNotes = request.Notes?.Trim();
        ticket.DeliverySignatureUrl = request.CustomerSignatureUrl?.Trim();
        ticket.Status = RepairTicketStatus.Delivered;

        ticketRepo.Update(ticket);

        await AddAuditHistoryAsync(
            historyRepo, 
            ticket.Id, 
            ticket.Status.ToString(), 
            "Delivered", 
            $"Bàn giao thiết bị cho khách hàng: {request.ReceiverName} (SĐT: {request.ReceiverPhone}).", 
            request.Notes, 
            cancellationToken
        );

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task AddAuditHistoryAsync(
        IRepository<RepairStatusHistoryEntity> historyRepo,
        Guid ticketId,
        string status,
        string action,
        string? note,
        string? details = null,
        CancellationToken cancellationToken = default)
    {
        Guid? actorId = null;
        if (Guid.TryParse(_currentUserService.UserId, out var uid))
        {
            actorId = uid;
        }

        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticketId,
            Status = status,
            Action = action,
            Note = note,
            ActorId = actorId,
            ActorName = _currentUserService.Username ?? "Nhân viên",
            Details = details
        };
        await historyRepo.AddAsync(history, cancellationToken);
    }

    private async Task NotifyManagersAsync(Guid? branchId, string title, string content, CancellationToken cancellationToken)
    {
        if (_notificationService == null) return;
        try
        {
            var userRepo = _unitOfWork.Repository<UserEntity>();
            var targetBranch = branchId ?? Guid.Empty;
            var managerUserIds = await userRepo.GetQueryableAsNoTracking()
                .Where(u => u.Status == UserStatus.Active &&
                            (targetBranch == Guid.Empty || u.BranchId == targetBranch || u.BranchId == Guid.Empty) &&
                            u.UserRoles.Any(ur => ur.Role.Name == CanonicalRoles.Manager || ur.Role.Name == CanonicalRoles.Admin || ur.Role.Name == CanonicalRoles.Owner))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            foreach (var managerId in managerUserIds)
            {
                await _notificationService.SendToUserAsync(managerId, title, content, cancellationToken);
            }
        }
        catch
        {
            // Tránh ngắt quãng luồng chính nếu có sự cố gửi thông báo
        }
    }
}
