using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Repair.DTOs;
using PSP.Application.Modules.Repair.Queries;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Repair.Handlers;

/// <summary>
/// Bộ xử lý các truy vấn (Queries) đọc dữ liệu cho Phân hệ Dịch vụ - Sửa chữa.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này truy vấn thông tin chi tiết một phiếu sửa chữa hoặc tìm kiếm danh sách phiếu sửa chữa có phân trang.
/// - Thực hiện nạp phẳng dữ liệu liên quan (Khách hàng, Thiết bị, Nhân viên tiếp nhận, Kỹ thuật viên) tuần tự nhằm đảm bảo kiến trúc sạch.
/// </summary>
public class RepairQueryHandlers :
    IRequestHandler<GetRepairTicketByIdQuery, RepairTicketDto>,
    IRequestHandler<GetRepairTicketsQuery, (IEnumerable<RepairTicketDto> Items, int TotalCount)>
{
    private readonly IUnitOfWork _unitOfWork;

    public RepairQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// 1. Truy vấn chi tiết 1 phiếu sửa chữa theo ID.
    /// </summary>
    public async Task<RepairTicketDto> Handle(GetRepairTicketByIdQuery request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();

        // 1.1 Tìm phiếu sửa chữa theo ID (Không tracking để tăng tốc)
        var ticket = await ticketRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.Id);
        }

        // 1.2 Nạp thông tin Khách hàng
        var customer = await customerRepo.GetByIdAsNoTrackingAsync(ticket.CustomerId, cancellationToken);
        
        // 1.3 Nạp thông tin Thiết bị được sửa
        var variant = await variantRepo.GetByIdAsNoTrackingAsync(ticket.ProductVariantId, cancellationToken);

        // 1.4 Nạp thông tin Nhân viên tiếp nhận và Kỹ thuật viên
        var receivedBy = await userRepo.GetByIdAsNoTrackingAsync(ticket.ReceivedById, cancellationToken);
        var technician = ticket.TechnicianId.HasValue
            ? await userRepo.GetByIdAsNoTrackingAsync(ticket.TechnicianId.Value, cancellationToken)
            : null;

        // 1.5 Lấy danh sách linh kiện thay thế đã sử dụng
        var parts = await partRepo.FindAsNoTrackingAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
        var partDtos = new List<RepairPartDto>();
        decimal partsTotal = 0;

        foreach (var part in parts)
        {
            var partVariant = await variantRepo.GetByIdAsNoTrackingAsync(part.ProductVariantId, cancellationToken);
            partDtos.Add(new RepairPartDto
            {
                Id = part.Id,
                RepairTicketId = part.RepairTicketId,
                ProductVariantId = part.ProductVariantId,
                ProductName = partVariant?.Name ?? "Linh kiện không xác định",
                ProductSku = partVariant?.Sku ?? string.Empty,
                Quantity = part.Quantity,
                UnitPrice = part.UnitPrice
            });

            partsTotal += part.UnitPrice * part.Quantity;
        }

        // 1.6 Lấy lịch sử chuyển đổi trạng thái của phiếu sửa chữa
        var histories = await historyRepo.FindAsNoTrackingAsync(h => h.RepairTicketId == ticket.Id && !h.IsDeleted, cancellationToken);
        var historyDtos = histories
            .OrderBy(h => h.CreatedAt)
            .Select(h => new RepairStatusHistoryDto
            {
                Id = h.Id,
                RepairTicketId = h.RepairTicketId,
                Status = h.Status,
                Note = h.Note,
                CreatedAt = h.CreatedAt,
                CreatedBy = h.CreatedBy
            })
            .ToList();

        // 1.7 Ánh xạ và tính toán dữ liệu trả về DTO
        var dto = new RepairTicketDto
        {
            Id = ticket.Id,
            CustomerId = ticket.CustomerId,
            CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
            CustomerPhone = customer?.Phone ?? string.Empty,
            ProductVariantId = ticket.ProductVariantId,
            ProductName = variant?.Name ?? "Thiết bị không xác định",
            ProductSku = variant?.Sku ?? string.Empty,
            Imei = ticket.Imei,
            ReceivedById = ticket.ReceivedById,
            ReceivedByName = receivedBy?.FullName ?? "Hệ thống",
            TechnicianId = ticket.TechnicianId,
            TechnicianName = technician?.FullName,
            Code = ticket.Code,
            Status = ticket.Status.ToString(),
            ProblemDescription = ticket.ProblemDescription,
            EstimatedCost = ticket.EstimatedCost,
            ActualCost = ticket.ActualCost,
            LaborCost = ticket.LaborCost,
            PartsTotal = partsTotal,
            ReceivedDate = ticket.ReceivedDate,
            CompletedDate = ticket.CompletedDate,
            CreatedAt = ticket.CreatedAt,
            CreatedBy = ticket.CreatedBy,
            Parts = partDtos,
            StatusHistories = historyDtos
        };

        return dto;
    }

    /// <summary>
    /// 2. Truy vấn danh sách phiếu sửa chữa có bộ lọc phân trang.
    /// </summary>
    public async Task<(IEnumerable<RepairTicketDto> Items, int TotalCount)> Handle(GetRepairTicketsQuery request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var customerRepo = _unitOfWork.Repository<CustomerEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var partRepo = _unitOfWork.Repository<RepairPartEntity>();

        // 2.1 Sử dụng IQueryable để xây dựng câu truy vấn động trên SQL Server
        var query = ticketRepo.GetQueryableAsNoTracking();

        // 2.2 Áp dụng các bộ lọc nếu được truyền lên từ API
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var cleanCode = request.Code.Trim();
            query = query.Where(t => t.Code.Contains(cleanCode));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (Enum.TryParse<RepairTicketStatus>(request.Status, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

        if (request.CustomerId.HasValue)
        {
            query = query.Where(t => t.CustomerId == request.CustomerId.Value);
        }

        if (request.TechnicianId.HasValue)
        {
            query = query.Where(t => t.TechnicianId == request.TechnicianId.Value);
        }

        // 2.3 Lấy tổng số dòng khớp bộ lọc (để phục vụ việc tính toán phân trang ở Client)
        var totalCount = query.Count();

        // 2.4 Áp dụng Phân trang (Skip / Take) và sắp xếp mới nhất lên đầu
        var tickets = query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtoList = new List<RepairTicketDto>();

        // 2.5 Lặp qua từng dòng dữ liệu và nạp các thực thể phụ
        foreach (var ticket in tickets)
        {
            var customer = await customerRepo.GetByIdAsNoTrackingAsync(ticket.CustomerId, cancellationToken);
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(ticket.ProductVariantId, cancellationToken);
            var receivedBy = await userRepo.GetByIdAsNoTrackingAsync(ticket.ReceivedById, cancellationToken);
            var technician = ticket.TechnicianId.HasValue
                ? await userRepo.GetByIdAsNoTrackingAsync(ticket.TechnicianId.Value, cancellationToken)
                : null;

            // Tính tổng tiền linh kiện đã lắp cho phiếu này
            var parts = await partRepo.FindAsNoTrackingAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            decimal partsTotal = parts.Sum(p => p.UnitPrice * p.Quantity);

            dtoList.Add(new RepairTicketDto
            {
                Id = ticket.Id,
                CustomerId = ticket.CustomerId,
                CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
                CustomerPhone = customer?.Phone ?? string.Empty,
                ProductVariantId = ticket.ProductVariantId,
                ProductName = variant?.Name ?? "Thiết bị không xác định",
                ProductSku = variant?.Sku ?? string.Empty,
                Imei = ticket.Imei,
                ReceivedById = ticket.ReceivedById,
                ReceivedByName = receivedBy?.FullName ?? "Hệ thống",
                TechnicianId = ticket.TechnicianId,
                TechnicianName = technician?.FullName,
                Code = ticket.Code,
                Status = ticket.Status.ToString(),
                ProblemDescription = ticket.ProblemDescription,
                EstimatedCost = ticket.EstimatedCost,
                ActualCost = ticket.ActualCost,
                LaborCost = ticket.LaborCost,
                PartsTotal = partsTotal,
                ReceivedDate = ticket.ReceivedDate,
                CompletedDate = ticket.CompletedDate,
                CreatedAt = ticket.CreatedAt,
                CreatedBy = ticket.CreatedBy
            });
        }

        return (dtoList, totalCount);
    }
}
