using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Warranty.DTOs;
using PSP.Application.Modules.Warranty.Queries;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;

namespace PSP.Application.Modules.Warranty.Handlers;

/// <summary>
/// Bộ xử lý các truy vấn (Queries) đọc dữ liệu cho Phân hệ Bảo hành.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này truy vấn thông tin chi tiết một phiếu bảo hành hoặc tìm kiếm danh sách phiếu bảo hành có phân trang.
/// - Đặc biệt hiện thực CheckWarrantyStatusQuery giúp nhân viên tra cứu thời hạn bảo hành của thiết bị qua IMEI xem còn hạn 12 tháng không.
/// </summary>
public class WarrantyQueryHandlers :
    IRequestHandler<GetWarrantyTicketByIdQuery, WarrantyTicketDto>,
    IRequestHandler<GetWarrantyTicketsQuery, (IEnumerable<WarrantyTicketDto> Items, int TotalCount)>,
    IRequestHandler<CheckWarrantyStatusQuery, WarrantyCheckResultDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService? _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public WarrantyQueryHandlers(
        IUnitOfWork unitOfWork,
        ICurrentUserService? currentUserService,
        IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// 1. Truy vấn chi tiết Phiếu bảo hành theo ID.
    /// </summary>
    public async Task<WarrantyTicketDto> Handle(GetWarrantyTicketByIdQuery request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var historyRepo = _unitOfWork.Repository<WarrantyHistoryEntity>();

        // 1.1 Tìm phiếu sửa chữa (Không tracking)
        var ticket = await ticketRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu bảo hành", request.Id);
        }

        // 1.2 Nạp thông tin khách hàng, đơn hàng bán lẻ và sản phẩm
        var customer = await customerRepo.GetByIdAsNoTrackingAsync(ticket.CustomerId, cancellationToken);
        var salesOrder = ticket.SalesOrderId.HasValue
            ? await salesOrderRepo.GetByIdAsNoTrackingAsync(ticket.SalesOrderId.Value, cancellationToken)
            : null;

        var variant = await variantRepo.GetByIdAsNoTrackingAsync(ticket.ProductVariantId, cancellationToken);

        var repairTicketRepo = _unitOfWork.Repository<PSP.Domain.Modules.Repair.Entities.RepairTicketEntity>();
        var repairTicket = ticket.RepairTicketId.HasValue
            ? await repairTicketRepo.GetByIdAsNoTrackingAsync(ticket.RepairTicketId.Value, cancellationToken)
            : null;

        // 1.3 Nạp lịch sử xử lý bảo hành
        var histories = await historyRepo.FindAsNoTrackingAsync(h => h.WarrantyTicketId == ticket.Id && !h.IsDeleted, cancellationToken);
        var historyDtos = histories
            .OrderBy(h => h.CreatedAt)
            .Select(h => new WarrantyHistoryDto
            {
                Id = h.Id,
                WarrantyTicketId = h.WarrantyTicketId,
                Action = h.Action,
                Status = h.Status,
                Description = h.Description,
                ActorId = h.ActorId,
                ActorName = h.ActorName,
                Notes = h.Notes,
                CreatedAt = h.CreatedAt,
                CreatedBy = h.CreatedBy
            })
            .ToList();

        // 1.4 Ánh xạ ra DTO
        var dto = new WarrantyTicketDto
        {
            Id = ticket.Id,
            CustomerId = ticket.CustomerId,
            CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
            CustomerPhone = customer?.Phone ?? string.Empty,
            SalesOrderId = ticket.SalesOrderId,
            SalesOrderCode = salesOrder?.Code,
            ProductVariantId = ticket.ProductVariantId,
            ProductName = variant?.Name ?? "Thiết bị không xác định",
            ProductSku = variant?.Sku ?? string.Empty,
            Imei = ticket.Imei,
            Code = ticket.Code,
            Status = ticket.Status.ToString(),
            StartDate = ticket.StartDate,
            EndDate = ticket.EndDate,
            Note = ticket.Note,
            RejectReason = ticket.RejectReason?.ToString(),
            RejectNotes = ticket.RejectNotes,
            EvidencePhotoUrls = ticket.EvidencePhotoUrls,
            TransferToPaidRepair = ticket.TransferToPaidRepair,
            RepairTicketId = ticket.RepairTicketId,
            RepairTicketCode = repairTicket?.Code,
            VendorName = ticket.VendorName,
            VendorTicketNumber = ticket.VendorTicketNumber,
            TrackingNumber = ticket.TrackingNumber,
            VendorSubStatus = ticket.VendorSubStatus?.ToString(),
            CreatedAt = ticket.CreatedAt,
            CreatedBy = ticket.CreatedBy,
            Histories = historyDtos,
            RowVersion = ticket.RowVersion
        };

        return dto;
    }

    /// <summary>
    /// 2. Truy vấn danh sách phiếu bảo hành có phân trang và bộ lọc.
    /// </summary>
    public async Task<(IEnumerable<WarrantyTicketDto> Items, int TotalCount)> Handle(GetWarrantyTicketsQuery request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<WarrantyTicketEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 2.1 Sử dụng IQueryable để xây dựng truy vấn động
        // Chính sách bảo hành áp dụng toàn hệ thống chuỗi cửa hàng PSP (hỗ trợ bảo hành liên chi nhánh)
        var query = ticketRepo.GetQueryableAsNoTracking();

        // 2.2 Áp dụng các bộ lọc đầu vào
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var cleanCode = request.Code.Trim();
            query = query.Where(t => t.Code.Contains(cleanCode));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (Enum.TryParse<WarrantyTicketStatus>(request.Status, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

        if (request.CustomerId.HasValue)
        {
            query = query.Where(t => t.CustomerId == request.CustomerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Imei))
        {
            var cleanImei = request.Imei.Trim();
            query = query.Where(t => t.Imei == cleanImei);
        }

        // 2.3 Lấy tổng dòng khớp bộ lọc
        var totalCount = query.Count();

        // 2.4 Áp dụng Phân trang
        var tickets = query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var repairTicketRepo = _unitOfWork.Repository<PSP.Domain.Modules.Repair.Entities.RepairTicketEntity>();
        var dtoList = new List<WarrantyTicketDto>();

        foreach (var ticket in tickets)
        {
            var customer = await customerRepo.GetByIdAsNoTrackingAsync(ticket.CustomerId, cancellationToken);
            var salesOrder = ticket.SalesOrderId.HasValue
                ? await salesOrderRepo.GetByIdAsNoTrackingAsync(ticket.SalesOrderId.Value, cancellationToken)
                : null;
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(ticket.ProductVariantId, cancellationToken);
            var repairTicket = ticket.RepairTicketId.HasValue
                ? await repairTicketRepo.GetByIdAsNoTrackingAsync(ticket.RepairTicketId.Value, cancellationToken)
                : null;

            dtoList.Add(new WarrantyTicketDto
            {
                Id = ticket.Id,
                CustomerId = ticket.CustomerId,
                CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
                CustomerPhone = customer?.Phone ?? string.Empty,
                SalesOrderId = ticket.SalesOrderId,
                SalesOrderCode = salesOrder?.Code,
                ProductVariantId = ticket.ProductVariantId,
                ProductName = variant?.Name ?? "Thiết bị không xác định",
                ProductSku = variant?.Sku ?? string.Empty,
                Imei = ticket.Imei,
                Code = ticket.Code,
                Status = ticket.Status.ToString(),
                StartDate = ticket.StartDate,
                EndDate = ticket.EndDate,
                Note = ticket.Note,
                RejectReason = ticket.RejectReason?.ToString(),
                RejectNotes = ticket.RejectNotes,
                EvidencePhotoUrls = ticket.EvidencePhotoUrls,
                TransferToPaidRepair = ticket.TransferToPaidRepair,
                RepairTicketId = ticket.RepairTicketId,
                RepairTicketCode = repairTicket?.Code,
                VendorName = ticket.VendorName,
                VendorTicketNumber = ticket.VendorTicketNumber,
                TrackingNumber = ticket.TrackingNumber,
                VendorSubStatus = ticket.VendorSubStatus?.ToString(),
                CreatedAt = ticket.CreatedAt,
                CreatedBy = ticket.CreatedBy,
                RowVersion = ticket.RowVersion
            });
        }

        return (dtoList, totalCount);
    }

    /// <summary>
    /// 3. Truy vấn kiểm tra hạn bảo hành của thiết bị qua IMEI.
    /// </summary>
    public async Task<WarrantyCheckResultDto> Handle(CheckWarrantyStatusQuery request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var imeiRepo = _unitOfWork.Repository<ImeiEntity>();

        var cleanImei = request.Imei.Trim().Replace("-", "").Replace(" ", "");
        bool isAuthenticated = !string.IsNullOrEmpty(_currentUserService?.UserId);

        // 3.1 Kiểm tra trạng thái hiện tại của IMEI trong DB
        var imeis = await imeiRepo.FindAsNoTrackingAsync(x => x.Imei == cleanImei, cancellationToken);
        var imeiEntity = imeis.FirstOrDefault();
        
        string currentImeiStatus = imeiEntity?.Status.ToString() ?? "Không tồn tại";

        // 3.2 Tìm đơn bán hàng lẻ của IMEI này
        var soldItems = await salesOrderItemRepo.FindAsNoTrackingAsync(x => x.Imei == cleanImei, cancellationToken);
        var soldItem = soldItems.LastOrDefault();

        if (soldItem == null)
        {
            // Thiết bị chưa bao giờ được bán ra từ hệ thống
            return new WarrantyCheckResultDto
            {
                Imei = cleanImei,
                IsUnderWarranty = false,
                WarrantyStatus = "NotFound",
                RemainingDays = 0,
                CurrentImeiStatus = isAuthenticated ? currentImeiStatus : string.Empty,
                ProductName = "Không tìm thấy thông tin",
                CustomerName = string.Empty
            };
        }

        // 3.3 Lấy thông tin đơn hàng, khách hàng, biến thể
        var salesOrder = await salesOrderRepo.GetByIdAsNoTrackingAsync(soldItem.SalesOrderId, cancellationToken);
        var variant = await variantRepo.GetByIdAsNoTrackingAsync(soldItem.ProductVariantId, cancellationToken);
        
        CustomerEntity? customer = null;
        if (salesOrder != null)
        {
            customer = await customerRepo.GetByIdAsNoTrackingAsync(salesOrder.CustomerId, cancellationToken);
        }

        // 3.4 Tính toán hạn bảo hành 12 tháng kể từ ngày bán
        DateTime? purchaseDate = salesOrder?.CreatedAt;
        DateTime? expirationDate = purchaseDate?.AddMonths(12);
        
        bool isUnderWarranty = false;
        if (salesOrder != null && salesOrder.Status == SalesOrderStatus.Completed && expirationDate.HasValue)
        {
            isUnderWarranty = DateTime.UtcNow <= expirationDate.Value;
        }

        int remainingDays = 0;
        if (isUnderWarranty && expirationDate.HasValue)
        {
            var diff = expirationDate.Value - DateTime.UtcNow;
            remainingDays = (int)Math.Max(0, Math.Ceiling(diff.TotalDays));
        }

        string warrantyStatus = isUnderWarranty ? "Active" : "Expired";

        // Customer privacy protection for public/anonymous lookup
        string customerName = customer?.FullName ?? "Khách hàng vãng lai";
        string? customerPhone = customer?.Phone;

        if (!isAuthenticated)
        {
            customerName = MaskCustomerName(customerName);
            customerPhone = null; // Do not leak customer phone to anonymous callers
        }

        return new WarrantyCheckResultDto
        {
            Imei = cleanImei,
            IsUnderWarranty = isUnderWarranty,
            WarrantyStatus = warrantyStatus,
            RemainingDays = remainingDays,
            PurchaseDate = purchaseDate,
            WarrantyExpirationDate = expirationDate,
            ProductVariantId = isAuthenticated ? soldItem.ProductVariantId : null,
            ProductName = variant?.Name ?? "Thiết bị không xác định",
            ProductSku = variant?.Sku ?? string.Empty,
            CustomerId = isAuthenticated ? salesOrder?.CustomerId : null,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            SalesOrderId = isAuthenticated ? salesOrder?.Id : null,
            SalesOrderCode = salesOrder?.Code,
            CurrentImeiStatus = isAuthenticated ? currentImeiStatus : string.Empty
        };
    }

    /// <summary>
    /// Che giấu tên khách hàng cho cổng tra cứu công khai (VD: 'Nguyễn Văn A' -> 'Nguyễn *** A').
    /// </summary>
    private static string MaskCustomerName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return string.Empty;

        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1)
        {
            return parts[0].Length <= 2 ? parts[0] : parts[0][0] + "***";
        }
        if (parts.Length == 2)
        {
            return parts[0] + " " + (parts[1].Length <= 2 ? parts[1] : parts[1][0] + "***");
        }

        return parts[0] + " *** " + parts[^1];
    }
}
