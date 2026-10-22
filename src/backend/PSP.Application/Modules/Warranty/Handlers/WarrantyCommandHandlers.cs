using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Warranty.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) của Phân hệ Bảo hành (Module 16).
/// </summary>
public class WarrantyCommandHandlers :
    IRequestHandler<CreateWarrantyTicketCommand, Guid>,
    IRequestHandler<UpdateWarrantyStatusCommand, bool>,
    IRequestHandler<DeleteWarrantyTicketCommand, bool>,
    IRequestHandler<RejectWarrantyCommand, bool>,
    IRequestHandler<TransferToInHouseRepairCommand, Guid>,
    IRequestHandler<ReplaceDeviceCommand, bool>,
    IRequestHandler<SendToVendorCommand, bool>,
    IRequestHandler<DeliverToCustomerCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;
    private readonly ICurrentUserService? _currentUserService;

    public WarrantyCommandHandlers(
        IUnitOfWork unitOfWork, 
        IScopeContextService? scopeContext = null,
        ICurrentUserService? currentUserService = null)
    {
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext ?? new ScopeContextService();
        _currentUserService = currentUserService;
    }


    /// <summary>
    /// 1. Xử lý tạo mới Phiếu tiếp nhận bảo hành.
    /// </summary>
    public async Task<Guid> Handle(CreateWarrantyTicketCommand request, CancellationToken cancellationToken)
    {
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();

        // 1.1 Kiểm tra Khách hàng có tồn tại không
        var customer = await customerRepo.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.CustomerId);
        }

        // 1.2 Kiểm tra Thiết bị (Biến thể) có hợp lệ không
        var variant = await variantRepo.GetByIdAsync(request.ProductVariantId, cancellationToken);
        if (variant == null)
        {
            throw new NotFoundException("Biến thể thiết bị bảo hành", request.ProductVariantId);
        }

        // 1.3 Kiểm tra IMEI có tồn tại trong hệ thống của cửa hàng không
        var cleanImei = request.Imei.Trim();
        var imeis = await imeiRepo.FindAsync(x => x.Imei == cleanImei, cancellationToken);
        var imeiEntity = imeis.FirstOrDefault();
        if (imeiEntity == null)
        {
            throw new BadRequestException($"Số IMEI '{cleanImei}' không tồn tại trên hệ thống của cửa hàng.");
        }

        // 1.4 RÀNG BUỘC BR-901: Chỉ thiết bị đã bán mới được bảo hành
        var soldItems = await salesOrderItemRepo.FindAsync(x => x.Imei == cleanImei, cancellationToken);
        var soldItem = soldItems.LastOrDefault(); // Lấy giao dịch bán gần nhất của IMEI này
        if (soldItem == null)
        {
            throw new BadRequestException($"Thiết bị với số IMEI '{cleanImei}' chưa từng phát sinh hóa đơn bán hàng lẻ.");
        }

        var salesOrder = await salesOrderRepo.GetByIdAsync(soldItem.SalesOrderId, cancellationToken);
        if (salesOrder == null || salesOrder.Status != SalesOrderStatus.Completed)
        {
            throw new BadRequestException($"Đơn hàng liên quan đến IMEI '{cleanImei}' chưa được thanh toán hoặc đã bị hủy.");
        }

        // Hỗ trợ bảo hành liên chi nhánh trong toàn hệ thống chuỗi cửa hàng PSP (BR-901)

        // 1.5 RÀNG BUỘC BR-902: Thời hạn bảo hành tối đa là 12 tháng kể từ ngày bán
        var purchaseDate = salesOrder.CreatedAt;
        var warrantyExpirationDate = purchaseDate.AddMonths(12);
        if (DateTime.UtcNow > warrantyExpirationDate)
        {
            throw new BadRequestException($"Thiết bị đã hết hạn bảo hành 12 tháng. Ngày mua: {purchaseDate:dd/MM/yyyy}, Ngày hết hạn: {warrantyExpirationDate:dd/MM/yyyy}.");
        }

        // 1.6 Sinh mã phiếu bảo hành chuẩn: WAR-yyyyMMdd-XXXXXX
        var ticketCode = "WAR-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        // 1.7 Cập nhật trạng thái IMEI sang WarrantyHold (Đang giữ bảo hành) để chặn việc xuất bán nhầm
        imeiEntity.Status = ImeiStatus.WarrantyHold;
        imeiRepo.Update(imeiEntity);

        // 1.8 Tạo phiếu bảo hành mới
        var ticket = new WarrantyTicketEntity
        {
            CustomerId = request.CustomerId,
            SalesOrderId = salesOrder.Id,
            ProductVariantId = request.ProductVariantId,
            Imei = cleanImei,
            Code = ticketCode,
            Status = WarrantyTicketStatus.Received,
            StartDate = DateTime.UtcNow,
            EndDate = null,
            Note = request.Note?.Trim()
        };

        await ticketRepo.AddAsync(ticket, cancellationToken);

        // 1.9 Tạo bản ghi lịch sử xử lý đầu tiên
        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Tiếp nhận thiết bị lỗi",
            Status = WarrantyTicketStatus.Received.ToString(),
            Description = "Tiếp nhận thiết bị bảo hành từ khách hàng."
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 1.10 Lưu thay đổi
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ticket.Id;
    }

    /// <summary>
    /// 2. Xử lý cập nhật tiến độ xử lý bảo hành & Hỗ trợ đổi máy mới (BR-905).
    /// </summary>
    public async Task<bool> Handle(UpdateWarrantyStatusCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // 2.1 Tìm phiếu bảo hành
        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        // 2.1.1 Pre-flight RowVersion Concurrency Check
        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        // 2.1.2 State Transition Validation (Business State Machine)
        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Phiếu bảo hành đang ở trạng thái {ticket.Status} và đã kết thúc xử lý, không thể cập nhật thêm.");
        }

        bool isValidTransition = false;
        if (ticket.Status == WarrantyTicketStatus.Received)
        {
            if (request.Status == WarrantyTicketStatus.Processing || 
                request.Status == WarrantyTicketStatus.Completed || 
                request.Status == WarrantyTicketStatus.Rejected || 
                request.Status == WarrantyTicketStatus.Cancelled)
            {
                isValidTransition = true;
            }
        }
        else if (ticket.Status == WarrantyTicketStatus.Processing)
        {
            if (request.Status == WarrantyTicketStatus.Completed || 
                request.Status == WarrantyTicketStatus.Rejected || 
                request.Status == WarrantyTicketStatus.Cancelled)
            {
                isValidTransition = true;
            }
        }

        if (!isValidTransition)
        {
            throw new BadRequestException($"Chuyển đổi trạng thái không hợp lệ: Từ {ticket.Status} sang {request.Status}.");
        }

        // 2.2 RÀNG BUỘC BR-905: Nếu đổi máy mới cho khách hàng
        string oldImei = ticket.Imei ?? string.Empty;
        string? resolvedNewImei = null;

        if (!string.IsNullOrWhiteSpace(request.NewImei))
        {
            var cleanNewImei = request.NewImei.Trim();
            if (cleanNewImei == oldImei)
            {
                throw new BadRequestException("IMEI mới trùng với IMEI hiện tại của thiết bị.");
            }

            // Kiểm tra xem IMEI mới có sẵn trong kho không
            var newImeis = await imeiRepo.FindAsync(x => x.Imei == cleanNewImei, cancellationToken);
            var newImeiEntity = newImeis.FirstOrDefault();

            if (newImeiEntity == null)
            {
                throw new BadRequestException($"Số IMEI mới '{cleanNewImei}' không tồn tại trên hệ thống.");
            }

            if (newImeiEntity.Status != ImeiStatus.InStock)
            {
                throw new BadRequestException($"Thiết bị mới với IMEI '{cleanNewImei}' không ở trạng thái Trong kho (InStock) để đổi trả (Trạng thái hiện tại: {newImeiEntity.Status}).");
            }

            if (newImeiEntity.WarehouseId.HasValue)
            {
                await _scopeContext.ValidateWarehouseAccessAsync(_unitOfWork, newImeiEntity.WarehouseId.Value, "đổi thiết bị bảo hành", cancellationToken);
            }

            // Tiến hành đổi máy:
            // a) Cập nhật máy cũ sang Disposed (hỏng ngừng sử dụng)
            var oldImeis = await imeiRepo.FindAsync(x => x.Imei == oldImei, cancellationToken);
            var oldImeiEntity = oldImeis.FirstOrDefault();
            if (oldImeiEntity != null)
            {
                oldImeiEntity.Status = ImeiStatus.Disposed;
                imeiRepo.Update(oldImeiEntity);
            }

            // b) Cập nhật máy mới sang Sold (đã bán) và rời kho
            newImeiEntity.Status = ImeiStatus.Sold;
            newImeiEntity.WarehouseId = null; // Rời kho vật lý
            imeiRepo.Update(newImeiEntity);

            // c) Cập nhật số IMEI trên phiếu bảo hành
            ticket.Imei = cleanNewImei;
            resolvedNewImei = cleanNewImei;
        }

        // 2.3 Cập nhật ngày kết thúc nếu hoàn thành bảo hành hoặc từ chối
        if (request.Status == WarrantyTicketStatus.Completed || request.Status == WarrantyTicketStatus.Rejected || request.Status == WarrantyTicketStatus.Cancelled)
        {
            ticket.EndDate = DateTime.UtcNow;

            // Khi trả thiết bị về khách hàng:
            // Trả trạng thái IMEI hiện tại về Sold (Vì khách nhận máy mang về dùng tiếp)
            string targetImeiToReturn = resolvedNewImei ?? oldImei;
            if (!string.IsNullOrEmpty(targetImeiToReturn))
            {
                var returnImeis = await imeiRepo.FindAsync(x => x.Imei == targetImeiToReturn, cancellationToken);
                var returnImeiEntity = returnImeis.FirstOrDefault();
                if (returnImeiEntity != null && returnImeiEntity.Status != ImeiStatus.Disposed)
                {
                    returnImeiEntity.Status = ImeiStatus.Sold;
                    imeiRepo.Update(returnImeiEntity);
                }
            }
        }

        // 2.4 Cập nhật trạng thái phiếu
        ticket.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            ticket.Note = string.IsNullOrEmpty(ticket.Note) 
                ? request.Description 
                : $"{ticket.Note} | {request.Description}";
        }
        ticketRepo.Update(ticket);

        // 2.5 Lưu lịch sử
        string historyDesc = request.Description ?? $"Cập nhật trạng thái sang {request.Status}.";
        if (!string.IsNullOrEmpty(resolvedNewImei))
        {
            historyDesc += $" (Thực hiện đổi máy: IMEI cũ {oldImei} -> IMEI mới {resolvedNewImei}).";
        }

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = request.Action.Trim(),
            Status = request.Status.ToString(),
            Description = historyDesc
        };
        await historyRepo.AddAsync(history, cancellationToken);

        // 2.6 Lưu thay đổi
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }

    /// <summary>
    /// 3. Xóa phiếu bảo hành nháp (chỉ cho phép khi ở trạng thái Received).
    /// </summary>
    public async Task<bool> Handle(DeleteWarrantyTicketCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        // 3.1 Tìm phiếu bảo hành
        var ticket = await ticketRepo.GetByIdAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.Id);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        // 3.1.1 Pre-flight RowVersion Concurrency Check
        if (request.RowVersion != null && request.RowVersion.Length > 0 && !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        // 3.2 Chặn xóa nếu phiếu đã xử lý
        if (ticket.Status != WarrantyTicketStatus.Received)
        {
            throw new BadRequestException($"Không thể xóa phiếu bảo hành ở trạng thái '{ticket.Status}'. Chỉ cho phép xóa khi mới Tiếp nhận (Received).");
        }

        // 3.3 Hồi phục trạng thái IMEI cũ về Sold (Do không làm bảo hành nữa)
        if (!string.IsNullOrEmpty(ticket.Imei))
        {
            var imeis = await imeiRepo.FindAsync(x => x.Imei == ticket.Imei, cancellationToken);
            var imeiEntity = imeis.FirstOrDefault();
            if (imeiEntity != null && imeiEntity.Status == ImeiStatus.WarrantyHold)
            {
                imeiEntity.Status = ImeiStatus.Sold;
                imeiRepo.Update(imeiEntity);
            }
        }

        // 3.4 Thực hiện xóa mềm
        ticketRepo.Remove(ticket);

        // 3.5 Lưu thay đổi
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }

    /// <summary>
    /// 4. Nhánh 1: Xử lý từ chối bảo hành do vi phạm chính sách (rơi vỡ, ẩm nước, hết hạn, can thiệp ngoài).
    /// Hỗ trợ cờ TransferToPaidRepair tự động tạo phiếu sửa chữa có phí nếu khách đồng ý.
    /// </summary>
    public async Task<bool> Handle(RejectWarrantyCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        // Concurrency Check
        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        // State Machine Check
        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Phiếu bảo hành đang ở trạng thái {ticket.Status} và đã kết thúc xử lý, không thể cập nhật thêm.");
        }

        ticket.Status = WarrantyTicketStatus.Rejected;
        ticket.RejectReason = request.Reason;
        ticket.RejectNotes = request.RejectNotes?.Trim();
        ticket.EvidencePhotoUrls = request.EvidencePhotoUrls?.Trim();
        ticket.TransferToPaidRepair = request.TransferToPaidRepair;

        var reasonText = request.Reason switch
        {
            RejectReason.WaterDamage => "Vào nước / Ẩm LCI",
            RejectReason.Dropped => "Rơi vỡ / Cấn móp cơ học",
            RejectReason.ThirdPartyIntervention => "Can thiệp ngoài / Rách tem",
            RejectReason.Expired => "Hết hạn bảo hành",
            _ => "Lý do khác"
        };

        if (request.TransferToPaidRepair)
        {
            var repairRepo = _unitOfWork.Repository<RepairTicketEntity>();
            var currentUserId = Guid.TryParse(_currentUserService?.UserId, out var uid) ? uid : Guid.Parse("20000000-0000-0000-0000-000000000001");
            var branchId = salesOrder?.BranchId ?? (Guid.TryParse(_currentUserService?.BranchId, out var bid) ? bid : (Guid?)null);
            var repairCode = "REP-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

            var repairTicket = new RepairTicketEntity
            {
                CustomerId = ticket.CustomerId,
                ProductVariantId = ticket.ProductVariantId,
                Imei = ticket.Imei,
                BranchId = branchId,
                ReceivedById = currentUserId,
                Code = repairCode,
                Status = RepairTicketStatus.Received,
                ProblemDescription = $"[Chuyển từ BH bị từ chối: {reasonText}] {request.RejectNotes}",
                ExteriorCondition = $"Từ chối BH: {reasonText}",
                EstimatedCost = 0,
                ActualCost = 0,
                LaborCost = 0,
                ReceivedDate = DateTime.UtcNow,
                WarrantyTicketId = ticket.Id
            };
            await repairRepo.AddAsync(repairTicket, cancellationToken);
            ticket.RepairTicketId = repairTicket.Id;
        }

        ticket.Note = string.IsNullOrEmpty(ticket.Note)
            ? $"[Từ chối BH: {reasonText}] {request.RejectNotes}"
            : $"{ticket.Note} | [Từ chối BH: {reasonText}] {request.RejectNotes}";

        Guid? actorId = Guid.TryParse(_currentUserService?.UserId, out var aId) ? aId : null;
        string actorName = _currentUserService?.Username ?? "Kỹ thuật viên";

        var historyDesc = $"Từ chối bảo hành: {reasonText}. Lý do chi tiết: {request.RejectNotes}";
        if (request.TransferToPaidRepair)
        {
            historyDesc += " (Tư vấn chuyển sang sửa chữa dịch vụ có phí).";
        }

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Từ chối bảo hành",
            Status = WarrantyTicketStatus.Rejected.ToString(),
            Description = historyDesc,
            ActorId = actorId,
            ActorName = actorName,
            Notes = request.RejectNotes
        };
        await historyRepo.AddAsync(history, cancellationToken);

        ticketRepo.Update(ticket);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }

    /// <summary>
    /// 5. Nhánh 2: Chuyển sửa chữa nội bộ In-house. Tự động lập phiếu sửa chữa với chi phí 0đ trong cùng transaction.
    /// </summary>
    public async Task<Guid> Handle(TransferToInHouseRepairCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();
        var repairRepo = _unitOfWork.Repository<RepairTicketEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Phiếu bảo hành đang ở trạng thái {ticket.Status} và đã kết thúc xử lý.");
        }

        var currentUserId = Guid.TryParse(_currentUserService?.UserId, out var uid) ? uid : Guid.Parse("20000000-0000-0000-0000-000000000001");
        var branchId = salesOrder?.BranchId ?? (Guid.TryParse(_currentUserService?.BranchId, out var bid) ? bid : (Guid?)null);
        var repairCode = "REP-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        var repairTicket = new RepairTicketEntity
        {
            CustomerId = ticket.CustomerId,
            ProductVariantId = ticket.ProductVariantId,
            Imei = ticket.Imei,
            BranchId = branchId,
            ReceivedById = currentUserId,
            TechnicianId = request.TechnicianId,
            Code = repairCode,
            Status = RepairTicketStatus.Received,
            ProblemDescription = $"[Bảo hành nội bộ - Phiếu {ticket.Code}] {request.ComponentDiagnosis.Trim()}",
            ExteriorCondition = "Bảo hành miễn phí theo tiêu chuẩn hãng",
            EstimatedCost = 0,
            ActualCost = 0,
            LaborCost = 0,
            ReceivedDate = DateTime.UtcNow,
            WarrantyTicketId = ticket.Id
        };
        await repairRepo.AddAsync(repairTicket, cancellationToken);

        ticket.Status = WarrantyTicketStatus.Processing;
        ticket.RepairTicketId = repairTicket.Id;
        ticket.Note = string.IsNullOrEmpty(ticket.Note)
            ? $"[Chuyển sửa nội bộ: {repairCode}] {request.ComponentDiagnosis.Trim()}"
            : $"{ticket.Note} | [Chuyển sửa nội bộ: {repairCode}] {request.ComponentDiagnosis.Trim()}";

        Guid? actorId = Guid.TryParse(_currentUserService?.UserId, out var aId) ? aId : null;
        string actorName = _currentUserService?.Username ?? "Kỹ thuật viên";

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Chuyển sửa chữa nội bộ",
            Status = WarrantyTicketStatus.Processing.ToString(),
            Description = $"Chuyển sửa chữa nội bộ: Đã tạo phiếu sửa chữa {repairCode} (Chi phí bảo hành 0đ). Chẩn đoán: {request.ComponentDiagnosis.Trim()}",
            ActorId = actorId,
            ActorName = actorName,
            Notes = request.ComponentDiagnosis.Trim()
        };
        await historyRepo.AddAsync(history, cancellationToken);

        ticketRepo.Update(ticket);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return repairTicket.Id;
    }

    /// <summary>
    /// 6. Nhánh 3: Đổi máy 1-1 theo quy chuẩn BR-905. Thu hồi IMEI cũ thành Disposed, xuất kho IMEI mới thành Sold.
    /// </summary>
    public async Task<bool> Handle(ReplaceDeviceCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Phiếu bảo hành đang ở trạng thái {ticket.Status} và đã kết thúc xử lý.");
        }

        string oldImei = ticket.Imei ?? string.Empty;
        string cleanNewImei = request.NewImei.Trim();

        if (cleanNewImei == oldImei)
        {
            throw new BadRequestException("IMEI mới trùng với IMEI hiện tại của thiết bị.");
        }

        var newImeis = await imeiRepo.FindAsync(x => x.Imei == cleanNewImei, cancellationToken);
        var newImeiEntity = newImeis.FirstOrDefault();
        if (newImeiEntity == null)
        {
            throw new BadRequestException($"Số IMEI mới '{cleanNewImei}' không tồn tại trên hệ thống kho.");
        }

        if (newImeiEntity.Status != ImeiStatus.InStock)
        {
            throw new BadRequestException($"Thiết bị mới với IMEI '{cleanNewImei}' không ở trạng thái Trong kho (InStock) để đổi trả (Trạng thái hiện tại: {newImeiEntity.Status}).");
        }

        if (newImeiEntity.WarehouseId.HasValue)
        {
            await _scopeContext.ValidateWarehouseAccessAsync(_unitOfWork, newImeiEntity.WarehouseId.Value, "đổi thiết bị bảo hành", cancellationToken);
        }

        // a) Máy cũ -> Disposed
        if (!string.IsNullOrEmpty(oldImei))
        {
            var oldImeis = await imeiRepo.FindAsync(x => x.Imei == oldImei, cancellationToken);
            var oldImeiEntity = oldImeis.FirstOrDefault();
            if (oldImeiEntity != null)
            {
                oldImeiEntity.Status = ImeiStatus.Disposed;
                imeiRepo.Update(oldImeiEntity);
            }
        }

        // b) Máy mới -> Sold, rời kho
        Guid? newImeiWarehouseId = newImeiEntity.WarehouseId;
        newImeiEntity.Status = ImeiStatus.Sold;
        newImeiEntity.WarehouseId = null;
        imeiRepo.Update(newImeiEntity);

        Guid? actorId = Guid.TryParse(_currentUserService?.UserId, out var aId) ? aId : null;
        string actorName = _currentUserService?.Username ?? "Nhân viên";

        // Trừ số lượng tồn kho và ghi sổ cái giao dịch (InventoryTransactionEntity)
        if (newImeiWarehouseId.HasValue)
        {
            var inventoryRepo = _unitOfWork.Repository<InventoryEntity>();
            var inventories = await inventoryRepo.FindAsync(
                x => x.WarehouseId == newImeiWarehouseId.Value && x.ProductVariantId == newImeiEntity.ProductVariantId,
                cancellationToken);
            var inventory = inventories.FirstOrDefault();
            if (inventory != null && inventory.Quantity > 0)
            {
                inventory.Quantity -= 1;
                inventoryRepo.Update(inventory);
            }

            var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(newImeiEntity.ProductVariantId, cancellationToken);

            var transactionRepo = _unitOfWork.Repository<InventoryTransactionEntity>();
            var transaction = new InventoryTransactionEntity
            {
                WarehouseId = newImeiWarehouseId.Value,
                ProductVariantId = newImeiEntity.ProductVariantId,
                ImeiId = newImeiEntity.Id,
                Type = InventoryTransactionType.SALE,
                QuantityChange = -1,
                CostSnapshot = variant?.CostPrice,
                ReferenceId = ticket.Id,
                ActorId = actorId ?? Guid.Empty,
                CreatedAt = DateTime.UtcNow
            };
            await transactionRepo.AddAsync(transaction, cancellationToken);
        }

        // c) Cập nhật phiếu bảo hành
        ticket.Imei = cleanNewImei;
        ticket.Status = WarrantyTicketStatus.Completed;
        ticket.EndDate = DateTime.UtcNow;

        var reasonDesc = !string.IsNullOrWhiteSpace(request.Reason) ? request.Reason.Trim() : "Lỗi phần cứng không thể khắc phục";
        ticket.Note = string.IsNullOrEmpty(ticket.Note)
            ? $"[Đổi máy mới 1-1 BR-905] Thu hồi {oldImei} -> Cấp mới {cleanNewImei}. Lý do: {reasonDesc}"
            : $"{ticket.Note} | [Đổi máy mới 1-1 BR-905] Thu hồi {oldImei} -> Cấp mới {cleanNewImei}. Lý do: {reasonDesc}";

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Đổi máy mới (BR-905)",
            Status = WarrantyTicketStatus.Completed.ToString(),
            Description = $"Thực hiện đổi máy mới 1-1: Thu hồi máy cũ ({oldImei}) sang Disposed, xuất máy mới ({cleanNewImei}) sang Sold. Lý do: {reasonDesc}",
            ActorId = actorId,
            ActorName = actorName,
            Notes = reasonDesc
        };
        await historyRepo.AddAsync(history, cancellationToken);

        ticketRepo.Update(ticket);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }

    /// <summary>
    /// 7. Nhánh 4: Gửi máy sang Trung tâm bảo hành Hãng (OEM RMA).
    /// </summary>
    public async Task<bool> Handle(SendToVendorCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException($"Phiếu bảo hành đang ở trạng thái {ticket.Status} và đã kết thúc xử lý.");
        }

        ticket.Status = WarrantyTicketStatus.Processing;
        ticket.VendorName = request.VendorName.Trim();
        ticket.VendorTicketNumber = request.VendorTicketNumber.Trim();
        ticket.TrackingNumber = request.TrackingNumber.Trim();
        ticket.VendorSubStatus = VendorSubStatus.AtVendor;

        var vendorInfo = $"TTBH: {request.VendorName.Trim()}, Mã phiếu hãng: {request.VendorTicketNumber.Trim()}, Vận đơn: {request.TrackingNumber.Trim()}";
        ticket.Note = string.IsNullOrEmpty(ticket.Note)
            ? $"[Gửi hãng OEM RMA: {vendorInfo}] {request.Notes?.Trim()}"
            : $"{ticket.Note} | [Gửi hãng OEM RMA: {vendorInfo}] {request.Notes?.Trim()}";

        Guid? actorId = Guid.TryParse(_currentUserService?.UserId, out var aId) ? aId : null;
        string actorName = _currentUserService?.Username ?? "Nhân viên";

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Gửi hãng ủy quyền (OEM RMA)",
            Status = WarrantyTicketStatus.Processing.ToString(),
            Description = $"Chuyển thiết bị sang trung tâm bảo hành Hãng/NCC: {request.VendorName.Trim()}. Mã tiếp nhận hãng: {request.VendorTicketNumber.Trim()}. Mã vận đơn: {request.TrackingNumber.Trim()}. Ghi chú: {request.Notes?.Trim()}",
            ActorId = actorId,
            ActorName = actorName,
            Notes = request.Notes?.Trim()
        };
        await historyRepo.AddAsync(history, cancellationToken);

        ticketRepo.Update(ticket);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }

    /// <summary>
    /// 8. Bàn giao thiết bị trả lại cho khách hàng (Deliver).
    /// Hoàn tất vòng đời bảo hành khi máy đã xử lý xong hoặc máy bị từ chối bàn giao lại cho khách.
    /// </summary>
    public async Task<bool> Handle(DeliverToCustomerCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        var ticket = await ticketRepo.GetByIdAsync(request.WarrantyTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.WarrantyTicketId);
        }

        var salesOrder = ticket.SalesOrderId.HasValue
            ? await _unitOfWork.Repository<SalesOrderEntity>().GetByIdAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;
        if (!_scopeContext.IsEnterpriseScope && salesOrder != null)
        {
            _scopeContext.ValidateBranchAccess(salesOrder.BranchId, "phiếu bảo hành");
        }

        if (request.RowVersion == null || !ticket.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        // Only allow delivery if ticket is in Processing or Rejected
        if (ticket.Status != WarrantyTicketStatus.Processing && ticket.Status != WarrantyTicketStatus.Rejected)
        {
            throw new BadRequestException($"Chỉ cho phép bàn giao trả khách khi phiếu bảo hành ở trạng thái Đang xử lý (Processing) hoặc Từ chối (Rejected). Trạng thái hiện tại: {ticket.Status}.");
        }

        // Update status: If Processing -> Completed. If Rejected, stays Rejected with EndDate set.
        if (ticket.Status == WarrantyTicketStatus.Processing)
        {
            ticket.Status = WarrantyTicketStatus.Completed;
        }
        ticket.EndDate = DateTime.UtcNow;

        // Return IMEI status to Sold
        if (!string.IsNullOrEmpty(ticket.Imei))
        {
            var imeis = await imeiRepo.FindAsync(x => x.Imei == ticket.Imei, cancellationToken);
            var imeiEntity = imeis.FirstOrDefault();
            if (imeiEntity != null && imeiEntity.Status == ImeiStatus.WarrantyHold)
            {
                imeiEntity.Status = ImeiStatus.Sold;
                imeiRepo.Update(imeiEntity);
            }
        }

        var receiver = !string.IsNullOrWhiteSpace(request.ReceiverName) ? request.ReceiverName.Trim() : "Khách hàng";
        var deliverNotes = !string.IsNullOrWhiteSpace(request.Notes) ? request.Notes.Trim() : "Bàn giao thiết bị hoàn tất";

        ticket.Note = string.IsNullOrEmpty(ticket.Note)
            ? $"[Bàn giao trả khách: {receiver}] {deliverNotes}"
            : $"{ticket.Note} | [Bàn giao trả khách: {receiver}] {deliverNotes}";

        Guid? actorId = Guid.TryParse(_currentUserService?.UserId, out var aId) ? aId : null;
        string actorName = _currentUserService?.Username ?? "Nhân viên tiếp tân";

        var history = new WarrantyHistoryEntity
        {
            WarrantyTicketId = ticket.Id,
            Action = "Bàn giao trả khách",
            Status = ticket.Status.ToString(),
            Description = $"Bàn giao thiết bị cho khách hàng ({receiver}). Ghi chú: {deliverNotes}. Hoàn tất quy trình bảo hành.",
            ActorId = actorId,
            ActorName = actorName,
            Notes = deliverNotes
        };
        await historyRepo.AddAsync(history, cancellationToken);

        ticketRepo.Update(ticket);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Phiếu bảo hành đã bị thay đổi bởi một giao dịch khác. Vui lòng tải lại dữ liệu.");
        }

        return true;
    }
}

