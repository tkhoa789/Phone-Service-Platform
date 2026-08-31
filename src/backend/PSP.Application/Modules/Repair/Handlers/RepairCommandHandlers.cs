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
    IRequestHandler<CancelRepairTicketCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdempotencyService _idempotencyService;

    public RepairCommandHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IIdempotencyService idempotencyService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _idempotencyService = idempotencyService;
    }

    /// <summary>
    /// 1. XÃ¡Â»Â­ lÃƒÂ½ tÃ¡ÂºÂ¡o mÃ¡Â»â€ºi PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a (TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ lÃ¡Â»â€”i).
    /// </summary>
    public async Task<Guid> Handle(CreateRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        // 1.1 KiÃ¡Â»Æ’m tra KhÃƒÂ¡ch hÃƒÂ ng cÃƒÂ³ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i khÃƒÂ´ng
        var customer = await customerRepo.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("KhÃƒÂ¡ch hÃƒÂ ng", request.CustomerId);
        }

        // 1.2 KiÃ¡Â»Æ’m tra ThiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ (BiÃ¡ÂºÂ¿n thÃ¡Â»Æ’ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m) cÃƒÂ³ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i trong danh mÃ¡Â»Â¥c khÃƒÂ´ng
        var variant = await variantRepo.GetByIdAsync(request.ProductVariantId, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("BiÃ¡ÂºÂ¿n thÃ¡Â»Æ’ thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ sÃ¡Â»Â­a", request.ProductVariantId);
        }

        // 1.3 KiÃ¡Â»Æ’m tra KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn phÃ¡Â»Â¥ trÃƒÂ¡ch (nÃ¡ÂºÂ¿u cÃƒÂ³ truyÃ¡Â»Ân lÃƒÂªn)
        if (request.TechnicianId.HasValue)
        {
            var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
            if (tech == null)
            {
                throw new NotFoundException("KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn", request.TechnicianId.Value);
            }
        }

        // 1.4 LÃ¡ÂºÂ¥y thÃƒÂ´ng tin ngÃ†Â°Ã¡Â»Âi tiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n tÃ¡Â»Â« tÃƒÂ i khoÃ¡ÂºÂ£n Ã„â€˜ang Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p
        Guid employeeId = Guid.Empty;
        if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var parsedGuid))
        {
            employeeId = parsedGuid;
        }
        else
        {
            throw new BadRequestException("KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh thÃƒÂ´ng tin nhÃƒÂ¢n viÃƒÂªn tiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n phiÃ¡ÂºÂ¿u.");
        }

        // 1.5 TÃ¡ÂºÂ¡o mÃƒÂ£ phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a ngÃ¡ÂºÂ«u nhiÃƒÂªn nhÃ†Â°ng theo chuÃ¡ÂºÂ©n: REP-yyyyMMdd-XXXXXX
        var ticketCode = "REP-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        // 1.6 KhÃ¡Â»Å¸i tÃ¡ÂºÂ¡o phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a vÃ¡Â»â€ºi trÃ¡ÂºÂ¡ng thÃƒÂ¡i mÃ¡ÂºÂ·c Ã„â€˜Ã¡Â»â€¹nh ban Ã„â€˜Ã¡ÂºÂ§u lÃƒÂ  Received (TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n)
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

        // 1.7 Ghi nhÃ¡ÂºÂ­n lÃ¡Â»â€¹ch sÃ¡Â»Â­ trÃ¡ÂºÂ¡ng thÃƒÂ¡i Ã„â€˜Ã¡ÂºÂ§u tiÃƒÂªn
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = RepairTicketStatus.Received.ToString(),
            Note = "TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ lÃ¡Â»â€”i tÃ¡Â»Â« khÃƒÂ¡ch hÃƒÂ ng."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 1.8 LÃ†Â°u thay Ã„â€˜Ã¡Â»â€¢i vÃƒÂ o CSDL
        _idempotencyService.AttachRecord(ticket.Id);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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

        // 2.1 TÃƒÂ¬m phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a chÃƒÂ­nh
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);
        }

        // ChÃ¡ÂºÂ·n xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n nÃ¡ÂºÂ¿u phiÃ¡ÂºÂ¿u Ã„â€˜ÃƒÂ£ hoÃƒÂ n thÃƒÂ nh hoÃ¡ÂºÂ·c Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ hÃ¡Â»Â§y
        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Cancelled)
        {
            throw new BadRequestException("KhÃƒÂ´ng thÃ¡Â»Æ’ xuÃ¡ÂºÂ¥t thÃƒÂªm linh kiÃ¡Â»â€¡n cho phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a Ã„â€˜ÃƒÂ£ hoÃƒÂ n thÃƒÂ nh hoÃ¡ÂºÂ·c Ã„â€˜ÃƒÂ£ hÃ¡Â»Â§y.");
        }

        // 2.2 TÃƒÂ¬m biÃ¡ÂºÂ¿n thÃ¡Â»Æ’ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m lÃƒÂ m linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿
        var variant = await variantRepo.GetByIdAsync(request.ProductVariantId, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿", request.ProductVariantId);
        }

        // 2.3 TÃƒÂ¬m chi nhÃƒÂ¡nh cÃ¡Â»Â§a nhÃƒÂ¢n viÃƒÂªn tiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n phiÃ¡ÂºÂ¿u Ã„â€˜Ã¡Â»Æ’ xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh kho hÃƒÂ ng chi nhÃƒÂ¡nh Ã„â€˜ÃƒÂ³
        var receivedUser = await userRepo.GetByIdAsync(ticket.ReceivedById, cancellationToken);
        if (receivedUser == null)
        {
            throw new BadRequestException("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ¢n viÃƒÂªn lÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u tiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n.");
        }

        var branchId = receivedUser.BranchId;

        // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch cÃƒÂ¡c kho hÃƒÂ ng Ã„â€˜ang hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng thuÃ¡Â»â„¢c chi nhÃƒÂ¡nh nÃƒÂ y
        var branchWarehouses = await warehouseRepo.FindAsync(w => w.BranchId == branchId && !w.IsDeleted, cancellationToken);
        var warehouseIds = branchWarehouses.Select(w => w.Id).ToList();

        if (!warehouseIds.Any())
        {
            throw new BadRequestException("Chi nhÃƒÂ¡nh nÃƒÂ y khÃƒÂ´ng cÃƒÂ³ kho hÃƒÂ ng nÃƒÂ o Ã„â€˜ang hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng Ã„â€˜Ã¡Â»Æ’ xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n.");
        }

        // 2.4 KiÃ¡Â»Æ’m tra tÃ¡Â»â€œn kho cÃ¡Â»Â§a linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿ tÃ¡ÂºÂ¡i cÃƒÂ¡c kho hÃƒÂ ng thuÃ¡Â»â„¢c chi nhÃƒÂ¡nh nÃƒÂ y
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
    /// 3. XÃ¡Â»Â­ lÃƒÂ½ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a (Linear Status Transition).
    /// </summary>
    public async Task<bool> Handle(UpdateRepairStatusCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        // 3.1 TÃƒÂ¬m phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a chÃƒÂ­nh
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);
        }

        // NÃ¡ÂºÂ¿u trÃ¡ÂºÂ¡ng thÃƒÂ¡i mÃ¡Â»â€ºi trÃƒÂ¹ng trÃ¡ÂºÂ¡ng thÃƒÂ¡i cÃ…Â©, khÃƒÂ´ng cÃ¡ÂºÂ§n xÃ¡Â»Â­ lÃƒÂ½, trÃ¡ÂºÂ£ vÃ¡Â»Â true
        if (ticket.Status == request.Status)
        {
            // NÃ¡ÂºÂ¿u cÃƒÂ³ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t kÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn hoÃ¡ÂºÂ·c tiÃ¡Â»Ân cÃƒÂ´ng thÃ¡Â»Â£ thÃƒÂ¬ vÃ¡ÂºÂ«n xÃ¡Â»Â­ lÃƒÂ½ tiÃ¡ÂºÂ¿p
            if (request.TechnicianId.HasValue && ticket.TechnicianId != request.TechnicianId.Value)
            {
                var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
                if (tech == null)
                {
                    throw new NotFoundException("KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn", request.TechnicianId.Value);
                }
                ticket.TechnicianId = request.TechnicianId.Value;
                ticketRepo.Update(ticket);
                _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            return true;
        }

        // 3.2 RÃƒâ‚¬NG BUÃ¡Â»ËœC BR-SERV-01: ChuyÃ¡Â»Æ’n dÃ¡Â»â€¹ch trÃ¡ÂºÂ¡ng thÃƒÂ¡i tuyÃ¡ÂºÂ¿n tÃƒÂ­nh (chÃ¡Â»â€° Ã„â€˜i lÃƒÂªn, khÃƒÂ´ng Ã„â€˜i lÃƒÂ¹i)
                bool isValidTransition = false;
        if (request.Status == RepairTicketStatus.Cancelled)
        {
            isValidTransition = ticket.Status != RepairTicketStatus.Completed && ticket.Status != RepairTicketStatus.Cancelled;
        }
        else
        {
            switch (ticket.Status)
            {
                case RepairTicketStatus.Received:
                    isValidTransition = request.Status == RepairTicketStatus.Diagnosing || request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Completed;
                    break;
                case RepairTicketStatus.Diagnosing:
                    isValidTransition = request.Status == RepairTicketStatus.WaitingApproval || request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Repairing;
                    break;
                case RepairTicketStatus.WaitingApproval:
                    isValidTransition = request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Repairing;
                    break;
                case RepairTicketStatus.WaitingForParts:
                    isValidTransition = request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Completed;
                    break;
                case RepairTicketStatus.Repairing:
                    isValidTransition = request.Status == RepairTicketStatus.WaitingQC || request.Status == RepairTicketStatus.Completed;
                    break;
                case RepairTicketStatus.WaitingQC:
                    isValidTransition = request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Completed;
                    break;
                case RepairTicketStatus.Completed:
                    isValidTransition = request.Status == RepairTicketStatus.WaitingPickup || request.Status == RepairTicketStatus.Delivered;
                    break;
                case RepairTicketStatus.WaitingPickup:
                    isValidTransition = request.Status == RepairTicketStatus.Delivered;
                    break;
            }
        }

        if (!isValidTransition)
        {
            throw new ConflictException($"KhÃ´ng Ä‘Æ°á»£c phÃ©p lÃ¹i tráº¡ng thÃ¡i hoáº·c chuyá»ƒn Ä‘á»•i tráº¡ng thÃ¡i tá»« '{ticket.Status}' sang '{request.Status}'.");
        }

        // 3.3 NÃ¡ÂºÂ¿u cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn
        if (request.TechnicianId.HasValue)
        {
            var tech = await userRepo.GetByIdAsync(request.TechnicianId.Value, cancellationToken);
            if (tech == null)
            {
                throw new NotFoundException("KÃ¡Â»Â¹ thuÃ¡ÂºÂ­t viÃƒÂªn", request.TechnicianId.Value);
            }
            ticket.TechnicianId = request.TechnicianId.Value;
        }

        // 3.4 Bá» qua cáº­p nháº­t tiá»n cÃ´ng thá»£ sá»­a (Ä‘Ã£ chuyá»ƒn sang module khÃ¡c hoáº·c sáº½ cáº­p nháº­t riÃªng)

        // 3.5 BÃ¡ÂºÂ®T Ã„ Ã¡ÂºÂ¦U xÃ¡Â»Â­ lÃƒÂ½ nghiÃ¡Â»â€¡p vÃ¡Â»Â¥ khi chuyÃ¡Â»Æ’n sang trÃ¡ÂºÂ¡ng thÃƒÂ¡i Completed (HoÃƒÂ n thÃƒÂ nh)
        if (request.Status == RepairTicketStatus.Completed)
        {
            // LÃ¡ÂºÂ¥y toÃƒÂ n bÃ¡Â»â„¢ linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿ Ã„â€˜ÃƒÂ£ sÃ¡Â»Â­ dÃ¡Â»Â¥ng
            var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            decimal partsTotal = parts.Sum(p => p.UnitPrice * p.Quantity);

            // TÃƒÂ­nh toÃƒÂ¡n lÃ¡ÂºÂ¡i tÃ¡Â»â€¢ng chi phÃƒÂ­ thÃ¡Â»Â±c tÃ¡ÂºÂ¿ khÃƒÂ¡ch hÃƒÂ ng phÃ¡ÂºÂ£i trÃ¡ÂºÂ£ (ActualCost = TiÃ¡Â»Ân cÃƒÂ´ng + TiÃ¡Â»Ân linh kiÃ¡Â»â€¡n)
            ticket.ActualCost = ticket.LaborCost + partsTotal;
            ticket.CompletedDate = DateTime.UtcNow;
        }

        // 3.6 BÃ¡ÂºÂ®T Ã„ÂÃ¡ÂºÂ¦U xÃ¡Â»Â­ lÃƒÂ½ nghiÃ¡Â»â€¡p vÃ¡Â»Â¥ khi chuyÃ¡Â»Æ’n sang trÃ¡ÂºÂ¡ng thÃƒÂ¡i Cancelled (HÃ¡Â»Â§y phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a)
        if (request.Status == RepairTicketStatus.Cancelled)
        {
            // HOÃƒâ‚¬N TRÃ¡ÂºÂ¢ linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿ vÃ¡Â»Â kho hÃƒÂ ng cÃ¡Â»Â§a chi nhÃƒÂ¡nh (nÃ¡ÂºÂ¿u trÃ†Â°Ã¡Â»â€ºc Ã„â€˜ÃƒÂ³ Ã„â€˜ÃƒÂ£ lÃ¡Â»Â¡ xuÃ¡ÂºÂ¥t linh kiÃ¡Â»â€¡n)
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
                        var targetWarehouseId = warehouseIds.First(); // TrÃ¡ÂºÂ£ vÃ¡Â»Â kho Ã„â€˜Ã¡ÂºÂ§u tiÃƒÂªn cÃ¡Â»Â§a chi nhÃƒÂ¡nh

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
                                // NÃ¡ÂºÂ¿u chÃ†Â°a cÃƒÂ³ bÃ¡ÂºÂ£n ghi tÃ¡Â»â€œn kho Ã¡Â»Å¸ kho nÃƒÂ y, tÃ¡ÂºÂ¡o mÃ¡Â»â€ºi
                                var newInventory = new InventoryEntity
                                {
                                    WarehouseId = targetWarehouseId,
                                    ProductVariantId = part.ProductVariantId,
                                    Quantity = part.Quantity,
                                    MinimumStock = 0
                                };
                                await inventoryRepo.AddAsync(newInventory, cancellationToken);
                            }
                            
                            // Ã„ÂÃƒÂ¡nh dÃ¡ÂºÂ¥u linh kiÃ¡Â»â€¡n Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ xÃƒÂ³a (soft delete) do hÃ¡Â»Â§y phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a
                            partRepo.Remove(part);
                        }
                    }
                }
            }
            
            ticket.ActualCost = 0;
            ticket.CompletedDate = DateTime.UtcNow;
        }

        // 3.7 CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i phiÃ¡ÂºÂ¿u
        ticket.Status = request.Status;
        ticketRepo.Update(ticket);

        // 3.8 Ghi nhÃ¡ÂºÂ­n lÃ¡Â»â€¹ch sÃ¡Â»Â­ trÃ¡ÂºÂ¡ng thÃƒÂ¡i
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = request.Status.ToString(),
            Note = request.Note ?? $"HÃ¡Â»â€¡ thÃ¡Â»â€˜ng tÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng chuyÃ¡Â»Æ’n trÃ¡ÂºÂ¡ng thÃƒÂ¡i phiÃ¡ÂºÂ¿u sang {request.Status}."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 3.9 LÃ†Â°u tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ thay Ã„â€˜Ã¡Â»â€¢i
        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// 4. XÃ¡Â»Â­ lÃƒÂ½ xÃƒÂ³a phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a (chÃ¡Â»â€° cho phÃƒÂ©p Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i Received vÃƒÂ  chÃ†Â°a cÃƒÂ³ linh kiÃ¡Â»â€¡n).
    /// </summary>
    public async Task<bool> Handle(DeleteRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();

        // 4.1 TÃƒÂ¬m phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a chÃƒÂ­nh
        var ticket = await ticketRepo.GetByIdAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.Id);
        }

        // 4.2 KiÃ¡Â»Æ’m tra rÃƒÂ ng buÃ¡Â»â„¢c xÃƒÂ³a
        if (ticket.Status != RepairTicketStatus.Received)
        {
            throw new BadRequestException($"KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i '{ticket.Status}'. ChÃ¡Â»â€° cho phÃƒÂ©p xÃƒÂ³a khi Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i 'Received'.");
        }

        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        if (parts.Any())
        {
            throw new BadRequestException("KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a Ã„â€˜ÃƒÂ£ phÃƒÂ¡t sinh linh kiÃ¡Â»â€¡n thay thÃ¡ÂºÂ¿.");
        }

        // 4.3 ThÃ¡Â»Â±c hiÃ¡Â»â€¡n xÃƒÂ³a mÃ¡Â»Âm phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a
        ticketRepo.Remove(ticket);

        // 4.4 LÃ†Â°u thay Ã„â€˜Ã¡Â»â€¢i
        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
    /// <summary>
    /// 5. XÃ¡Â»Â­ lÃƒÂ½ Update trÃ¡ÂºÂ¡ng thÃƒÂ¡i linh kiÃ¡Â»â€¡n (Issue, Install)
    /// </summary>
    public async Task<bool> Handle(UpdateRepairPartStatusCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);

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
        if (ticket == null) throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiÃ¡Â»â€¡n", request.RepairPartId);

        if (!part.RowVersion.SequenceEqual(request.RowVersion))
            throw new ConflictException("ThÃƒÂ´ng tin linh kiÃ¡Â»â€¡n Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ thay Ã„â€˜Ã¡Â»â€¢i.");

        if (part.Status != RepairPartStatus.Issued && part.Status != RepairPartStatus.Installed && part.Status != RepairPartStatus.Reserved)
            throw new ConflictException($"KhÃ´ng thá»ƒ Return linh kiá»‡n Ä‘ang á»Ÿ tráº¡ng thÃ¡i {part.Status}.");

        if (part.Status == RepairPartStatus.Reserved)
        {
            // BÃ¡Â»  Reserved, khÃƒÂ´ng lÃƒÂ m thay Ã„â€˜Ã¡Â»â€¢i tÃ¡Â»â€œn kho
            part.Status = RepairPartStatus.Returned;
            partRepo.Update(part);
            
            if (part.ImeiId.HasValue)
            {
                var imei = await imeiRepo.GetByIdAsync(part.ImeiId.Value, cancellationToken);
                if (imei != null) { imei.Status = ImeiStatus.InStock; imeiRepo.Update(imei); }
            }
            
            _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }

        // Ã„ Ã„Â£ Issue hoÃ¡ÂºÂ·c Install => CÃ¡Â»â„¢ng lÃ¡ÂºÂ¡i tÃ¡Â»â€œn kho
        var warehouses = await warehouseRepo.FindAsync(w => w.BranchId == ticket.BranchId && !w.IsDeleted, cancellationToken);
        var warehouseId = warehouses.FirstOrDefault()?.Id;
        if (warehouseId == null) throw new BadRequestException("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y kho.");

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

        _idempotencyService.AttachRecord(true);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 7. XÃ¡Â»Â­ lÃƒÂ½ WriteOff linh kiÃ¡Â»â€¡n
    /// </summary>
    public async Task<bool> Handle(WriteOffRepairPartCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);

        var part = await partRepo.GetByIdAsync(request.RepairPartId, cancellationToken);
        if (part == null || part.RepairTicketId != ticket.Id) throw new NotFoundException("Linh kiÃ¡Â»â€¡n", request.RepairPartId);

        if (!part.RowVersion.SequenceEqual(request.RowVersion))
            throw new ConflictException("ThÃƒÂ´ng tin linh kiÃ¡Â»â€¡n Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ thay Ã„â€˜Ã¡Â»â€¢i.");

        if (part.Status != RepairPartStatus.Issued && part.Status != RepairPartStatus.Installed)
            throw new ConflictException($"Chá»‰ cÃ³ thá»ƒ WriteOff linh kiá»‡n Ä‘Ã£ Issue hoáº·c Install. Tráº¡ng thÃ¡i hiá»‡n táº¡i: {part.Status}.");

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
        return true;
    }

    /// <summary>
    /// 8. XÃ¡Â»Â­ lÃƒÂ½ HÃ¡Â»Â§y phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a kÃƒÂ¨m Dispositions
    /// </summary>
    public async Task<bool> Handle(CancelRepairTicketCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null) throw new NotFoundException("PhiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a", request.RepairTicketId);
        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Cancelled)
            throw new ConflictException("KhÃ´ng thá»ƒ há»§y phiáº¿u Ä‘Ã£ hoÃ n thÃ nh hoáº·c Ä‘Ã£ há»§y.");

        var parts = await partRepo.FindAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
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
                    throw new BadRequestException($"Linh kiÃ¡Â»â€¡n {part.Id} Ã„â€˜ang Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i {part.Status} cÃ¡ÂºÂ§n quyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh xÃ¡Â»Â­ lÃƒÂ½ (Return hoÃ¡ÂºÂ·c WriteOff) khi hÃ¡Â»Â§y phiÃ¡ÂºÂ¿u.");
                
                if (disp.Disposition == RepairPartStatus.Returned)
                    await Handle(new ReturnRepairPartCommand(ticket.Id, part.Id, part.RowVersion), cancellationToken);
                else if (disp.Disposition == RepairPartStatus.WriteOff)
                    await Handle(new WriteOffRepairPartCommand(ticket.Id, part.Id, disp.Reason ?? "HÃ¡Â»Â§y phiÃ¡ÂºÂ¿u", part.RowVersion), cancellationToken);
                else
                    throw new BadRequestException("QuyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh xÃ¡Â»Â­ lÃƒÂ½ linh kiÃ¡Â»â€¡n khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.");
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
            Note = request.Note ?? "HÃ¡Â»Â§y phiÃ¡ÂºÂ¿u sÃ¡Â»Â­a chÃ¡Â»Â¯a."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
