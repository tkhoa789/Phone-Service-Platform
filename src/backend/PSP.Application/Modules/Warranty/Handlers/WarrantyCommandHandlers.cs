using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;

namespace PSP.Application.Modules.Warranty.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) của Phân hệ Bảo hành (Module 16).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này hiện thực logic nghiệp vụ tiếp nhận bảo hành, đổi máy lỗi cho khách và cập nhật tiến độ xử lý.
/// - Áp dụng các quy tắc bảo hành (Business Rules):
///   1. Chỉ sản phẩm đã bán mới được bảo hành (IMEI phải có hóa đơn mua hàng đã hoàn thành).
///   2. Thời hạn bảo hành tối đa là 12 tháng kể từ ngày bán (BR-902).
///   3. Quy trình đổi máy: Máy cũ chuyển sang Disposed (ngừng dùng), máy mới lấy từ kho chuyển sang Sold (đã bán) và rời kho (BR-905).
///   4. Quản lý vòng đời trạng thái của IMEI (chuyển sang WarrantyHold khi tiếp nhận, trả về Sold khi xong hoặc từ chối).
/// </summary>
public class WarrantyCommandHandlers :
    IRequestHandler<CreateWarrantyTicketCommand, Guid>,
    IRequestHandler<UpdateWarrantyStatusCommand, bool>,
    IRequestHandler<DeleteWarrantyTicketCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public WarrantyCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        // Chặn chỉnh sửa nếu phiếu đã kết thúc
        if (ticket.Status == WarrantyTicketStatus.Completed || ticket.Status == WarrantyTicketStatus.Rejected || ticket.Status == WarrantyTicketStatus.Cancelled)
        {
            throw new BadRequestException("Phiếu bảo hành này đã kết thúc xử lý, không thể cập nhật thêm.");
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
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
