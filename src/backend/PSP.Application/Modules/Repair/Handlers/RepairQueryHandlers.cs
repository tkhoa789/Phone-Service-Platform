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
    IRequestHandler<GetRepairTicketsQuery, (IEnumerable<RepairTicketDto> Items, int TotalCount)>,
    IRequestHandler<GetRepairQueueStatsQuery, RepairQueueStatsDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public RepairQueryHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext;
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
        var checklistRepo = _unitOfWork.Repository<RepairChecklistEntity>();
        var checklistItemRepo = _unitOfWork.Repository<RepairChecklistItemEntity>();

        // 1.1 Tìm phiếu sửa chữa theo ID (Không tracking để tăng tốc)
        var ticket = await ticketRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.Id);
        }

        // Fail-Closed Branch Isolation Check
        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

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
                UnitPrice = part.UnitPrice,
                Status = part.Status.ToString(),
                AddedBy = part.CreatedBy,
                AddedAt = part.CreatedAt,
                RowVersion = part.RowVersion
            });

            if (part.Status != RepairPartStatus.Returned)
            {
                partsTotal += part.UnitPrice * part.Quantity;
            }
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
                Action = h.Action ?? "Status Changed",
                ActorId = h.ActorId,
                ActorName = h.ActorName ?? h.CreatedBy,
                Details = h.Details,
                CreatedAt = h.CreatedAt,
                CreatedBy = h.CreatedBy
            })
            .ToList();

        // 1.7 Lấy danh sách Checklist
        var checklists = await checklistRepo.FindAsNoTrackingAsync(c => c.RepairTicketId == ticket.Id && !c.IsDeleted, cancellationToken);
        var checklistDtos = new List<RepairChecklistDto>();
        foreach(var c in checklists)
        {
            var items = await checklistItemRepo.FindAsNoTrackingAsync(i => i.RepairChecklistId == c.Id && !i.IsDeleted, cancellationToken);
            var inspector = await userRepo.GetByIdAsNoTrackingAsync(c.InspectorId, cancellationToken);
            
            checklistDtos.Add(new RepairChecklistDto
            {
                Id = c.Id,
                RepairTicketId = c.RepairTicketId,
                Type = c.Type.ToString(),
                InspectorId = c.InspectorId,
                InspectorName = inspector?.FullName ?? string.Empty,
                InspectedAt = c.InspectedAt,
                CustomerSignatureUrl = c.CustomerSignatureUrl,
                Notes = c.Notes,
                CreatedAt = c.CreatedAt,
                Items = items.Select(i => new RepairChecklistItemDto
                {
                    Id = i.Id,
                    CheckPointName = i.CheckPointName,
                    IsPassed = i.IsPassed,
                    IssueDescription = i.IssueDescription
                }).ToList()
            });
        }

        // 1.8 Lấy danh sách Tiền cọc (Deposits)
        var depositRepo = _unitOfWork.Repository<RepairDepositEntity>();
        var paymentMethodRepo = _unitOfWork.Repository<PSP.Domain.Modules.Sales.Entities.PaymentMethodEntity>();
        
        var deposits = await depositRepo.FindAsNoTrackingAsync(d => d.RepairTicketId == ticket.Id && !d.IsDeleted, cancellationToken);
        var depositDtos = new List<RepairDepositDto>();
        foreach (var deposit in deposits)
        {
            var paymentMethod = await paymentMethodRepo.GetByIdAsNoTrackingAsync(deposit.PaymentMethodId, cancellationToken);
            var receiver = await userRepo.GetByIdAsNoTrackingAsync(deposit.ReceivedById, cancellationToken);
            depositDtos.Add(new RepairDepositDto
            {
                Id = deposit.Id,
                RepairTicketId = deposit.RepairTicketId,
                Amount = deposit.Amount,
                PaymentMethodId = deposit.PaymentMethodId,
                PaymentMethodName = paymentMethod?.Name ?? string.Empty,
                TransactionCode = deposit.TransactionCode,
                ReceivedById = deposit.ReceivedById,
                ReceivedByName = receiver?.FullName ?? string.Empty,
                PaidAt = deposit.PaidAt,
                Status = deposit.Status.ToString(),
                AppliedToInvoiceId = deposit.AppliedToInvoiceId
            });
        }

        // 1.9 Ánh xạ và tính toán dữ liệu trả về DTO
        var dto = new RepairTicketDto
        {
            Id = ticket.Id,
            CustomerId = ticket.CustomerId,
            CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
            CustomerPhone = customer?.Phone ?? string.Empty,
            ProductVariantId = ticket.ProductVariantId,
            ProductName = variant?.Name ?? "Thiết bị không xác định",
            ProductSku = variant?.Sku ?? string.Empty,
            Imei = string.IsNullOrWhiteSpace(ticket.Imei) ? null : ticket.Imei.Trim(),
            ReceivedById = ticket.ReceivedById,
            ReceivedByName = receivedBy?.FullName ?? "Hệ thống",
            TechnicianId = ticket.TechnicianId,
            TechnicianName = technician?.FullName,
            Code = ticket.Code,
            Status = ticket.Status.ToString(),
            ProblemDescription = ticket.ProblemDescription,
            ExteriorCondition = string.IsNullOrWhiteSpace(ticket.ExteriorCondition) ? null : ticket.ExteriorCondition.Trim(),
            CustomModelName = string.IsNullOrWhiteSpace(ticket.CustomModelName) ? null : ticket.CustomModelName.Trim(),
            EstimatedCost = ticket.EstimatedCost,
            ActualCost = ticket.ActualCost,
            LaborCost = ticket.LaborCost,
            PartsTotal = partsTotal,
            ReceivedDate = ticket.ReceivedDate,
            CompletedDate = ticket.CompletedDate,
            // Section 5: Diagnosis
            DiagnosisRootCause = ticket.DiagnosisRootCause,
            DiagnosisProposedSolution = ticket.DiagnosisProposedSolution,
            EstimatedDays = ticket.EstimatedDays,
            TechnicalNotes = ticket.TechnicalNotes,
            DiagnosedAt = ticket.DiagnosedAt,
            DiagnosedById = ticket.DiagnosedById,
            // Section 6: Approval
            CustomerApprovalStatus = ticket.CustomerApprovalStatus,
            CustomerApprovedAt = ticket.CustomerApprovedAt,
            CustomerApprovedById = ticket.CustomerApprovedById,
            CustomerApprovalMethod = ticket.CustomerApprovalMethod,
            CustomerApprovedAmount = ticket.CustomerApprovedAmount,
            CustomerApprovalNote = ticket.CustomerApprovalNote,
            // Section 12: Delivery
            DeliveredById = ticket.DeliveredById,
            DeliveredAt = ticket.DeliveredAt,
            DeliveredToCustomerName = ticket.DeliveredToCustomerName,
            DeliveryNotes = ticket.DeliveryNotes,
            DeliverySignatureUrl = ticket.DeliverySignatureUrl,
            CreatedAt = ticket.CreatedAt,
            CreatedBy = ticket.CreatedBy,
            IsTest = ticket.IsTest,
            Parts = partDtos,
            StatusHistories = historyDtos,
            Checklists = checklistDtos,
            Deposits = depositDtos
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
        var depositRepo = _unitOfWork.Repository<RepairDepositEntity>();

        // 2.1 Sử dụng IQueryable để xây dựng câu truy vấn động trên SQL Server
        var query = ticketRepo.GetQueryableAsNoTracking();

        // 2.1.5 Fail-Closed Branch Isolation
        if (!_scopeContext.IsEnterpriseScope)
        {
            var userBranchId = _scopeContext.GetRequiredBranchId();
            query = query.Where(t => t.BranchId == userBranchId);
        }

        // 2.1.6 Ẩn dữ liệu test mặc định (chỉ hiển thị khi IncludeTest = true)
        if (!request.IncludeTest)
        {
            query = query.Where(t => !t.IsTest);
        }

        // 2.2 Áp dụng các bộ lọc nếu được truyền lên từ API
        var search = !string.IsNullOrWhiteSpace(request.Search) ? request.Search.Trim() : (!string.IsNullOrWhiteSpace(request.Code) ? request.Code.Trim() : null);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var matchingCustomerIds = customerRepo.GetQueryableAsNoTracking()
                .Where(c => c.FullName.Contains(search) || c.Phone.Contains(search))
                .Select(c => c.Id)
                .ToList();

            query = query.Where(t => t.Code.Contains(search) 
                || (t.Imei != null && t.Imei.Contains(search)) 
                || t.ProblemDescription.Contains(search)
                || (t.CustomModelName != null && t.CustomModelName.Contains(search))
                || matchingCustomerIds.Contains(t.CustomerId));
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

        // 2.2.5 Bộ lọc hàng chờ chuyên dụng (Work Queue Tab)
        if (!string.IsNullOrWhiteSpace(request.Queue))
        {
            var q = request.Queue.Trim().ToUpperInvariant();
            if (q == "UNASSIGNED")
            {
                query = query.Where(t => 
                    (!t.TechnicianId.HasValue || t.TechnicianId.Value == Guid.Empty || t.Status == RepairTicketStatus.PendingAssignment) &&
                    t.Status != RepairTicketStatus.Completed && 
                    t.Status != RepairTicketStatus.WaitingPickup && 
                    t.Status != RepairTicketStatus.Delivered && 
                    t.Status != RepairTicketStatus.Cancelled);
            }
            else if (q == "MY_TICKETS")
            {
                if (Guid.TryParse(_currentUserService?.UserId, out var currentUserId))
                {
                    query = query.Where(t => 
                        t.TechnicianId.HasValue && 
                        t.TechnicianId.Value == currentUserId &&
                        t.Status != RepairTicketStatus.Completed && 
                        t.Status != RepairTicketStatus.WaitingPickup && 
                        t.Status != RepairTicketStatus.Delivered && 
                        t.Status != RepairTicketStatus.Cancelled);
                }
            }
            else if (q == "IN_PROGRESS")
            {
                var inProgressStatuses = new[]
                {
                    RepairTicketStatus.Received,
                    RepairTicketStatus.Diagnosing,
                    RepairTicketStatus.WaitingApproval,
                    RepairTicketStatus.WaitingForParts,
                    RepairTicketStatus.Repairing,
                    RepairTicketStatus.WaitingQC
                };
                query = query.Where(t => inProgressStatuses.Contains(t.Status));
            }
            else if (q == "COMPLETED")
            {
                query = query.Where(t => 
                    t.Status == RepairTicketStatus.Completed || 
                    t.Status == RepairTicketStatus.WaitingPickup);
            }
            else if (q == "DELIVERED")
            {
                query = query.Where(t => t.Status == RepairTicketStatus.Delivered);
            }
            else if (q == "BLOCKED")
            {
                query = query.Where(t => 
                    t.Status == RepairTicketStatus.WaitingForParts || 
                    t.Status == RepairTicketStatus.WaitingApproval);
            }
        }

        // 2.3 Lấy tổng số dòng khớp bộ lọc (để phục vụ việc tính toán phân trang ở Client)
        var totalCount = query.Count();

        // 2.4 Áp dụng Phân trang (Skip / Take) và sắp xếp nghiệp vụ:
        // Nhóm 0: Máy chưa có KTV nhận (!TechnicianId.HasValue) và chưa đóng -> ƯU TIÊN LÊN ĐẦU
        // Nhóm 1: Máy đã có KTV nhận đang trong tiến trình xử lý -> XẾP TIẾP THEO
        // Nhóm 2: Máy đã hoàn tất / bàn giao / hủy (Completed, Delivered, Cancelled) -> XẾP CUỐI CÙNG
        // Trong mỗi nhóm: Sắp xếp theo CreatedAt giảm dần (mới nhất lên trước)
        var tickets = query
            .OrderBy(t => 
                (t.Status == RepairTicketStatus.Completed || t.Status == RepairTicketStatus.Delivered || t.Status == RepairTicketStatus.Cancelled) ? 2 :
                (!t.TechnicianId.HasValue ? 0 : 1)
            )
            .ThenByDescending(t => t.CreatedAt)
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

            // Tính tổng tiền linh kiện đã lắp cho phiếu này (không tính linh kiện đã hoàn trả)
            var parts = await partRepo.FindAsNoTrackingAsync(p => p.RepairTicketId == ticket.Id && !p.IsDeleted, cancellationToken);
            decimal partsTotal = parts.Where(p => p.Status != RepairPartStatus.Returned).Sum(p => p.UnitPrice * p.Quantity);

            var deposits = await depositRepo.FindAsNoTrackingAsync(d => d.RepairTicketId == ticket.Id && !d.IsDeleted, cancellationToken);
            var depositDtos = deposits.Select(d => new RepairDepositDto
            {
                Id = d.Id,
                RepairTicketId = d.RepairTicketId,
                Amount = d.Amount,
                PaymentMethodId = d.PaymentMethodId,
                PaymentMethodName = d.PaymentMethod?.Name ?? "Tiền mặt",
                TransactionCode = d.TransactionCode,
                ReceivedById = d.ReceivedById,
                ReceivedByName = string.Empty,
                PaidAt = d.PaidAt,
                Status = d.Status.ToString(),
                AppliedToInvoiceId = d.AppliedToInvoiceId
            }).ToList();

            dtoList.Add(new RepairTicketDto
            {
                Id = ticket.Id,
                CustomerId = ticket.CustomerId,
                CustomerName = customer?.FullName ?? "Khách hàng vãng lai",
                CustomerPhone = customer?.Phone ?? string.Empty,
                ProductVariantId = ticket.ProductVariantId,
                ProductName = variant?.Name ?? "Thiết bị không xác định",
                ProductSku = variant?.Sku ?? string.Empty,
                Imei = string.IsNullOrWhiteSpace(ticket.Imei) ? null : ticket.Imei.Trim(),
                ReceivedById = ticket.ReceivedById,
                ReceivedByName = receivedBy?.FullName ?? "Hệ thống",
                TechnicianId = ticket.TechnicianId,
                TechnicianName = technician?.FullName,
                Code = ticket.Code,
                Status = ticket.Status.ToString(),
                ProblemDescription = ticket.ProblemDescription,
                ExteriorCondition = string.IsNullOrWhiteSpace(ticket.ExteriorCondition) ? null : ticket.ExteriorCondition.Trim(),
                CustomModelName = string.IsNullOrWhiteSpace(ticket.CustomModelName) ? null : ticket.CustomModelName.Trim(),
                EstimatedCost = ticket.EstimatedCost,
                ActualCost = ticket.ActualCost,
                LaborCost = ticket.LaborCost,
                PartsTotal = partsTotal,
                ReceivedDate = ticket.ReceivedDate,
                CompletedDate = ticket.CompletedDate,
                DiagnosisRootCause = ticket.DiagnosisRootCause,
                DiagnosisProposedSolution = ticket.DiagnosisProposedSolution,
                EstimatedDays = ticket.EstimatedDays,
                TechnicalNotes = ticket.TechnicalNotes,
                DiagnosedAt = ticket.DiagnosedAt,
                DiagnosedById = ticket.DiagnosedById,
                CustomerApprovalStatus = ticket.CustomerApprovalStatus,
                CustomerApprovedAt = ticket.CustomerApprovedAt,
                CustomerApprovedById = ticket.CustomerApprovedById,
                CustomerApprovalMethod = ticket.CustomerApprovalMethod,
                CustomerApprovedAmount = ticket.CustomerApprovedAmount,
                CustomerApprovalNote = ticket.CustomerApprovalNote,
                DeliveredById = ticket.DeliveredById,
                DeliveredAt = ticket.DeliveredAt,
                DeliveredToCustomerName = ticket.DeliveredToCustomerName,
                DeliveryNotes = ticket.DeliveryNotes,
                DeliverySignatureUrl = ticket.DeliverySignatureUrl,
                CreatedAt = ticket.CreatedAt,
                CreatedBy = ticket.CreatedBy,
                IsTest = ticket.IsTest,
                Deposits = depositDtos
            });
        }

        return (dtoList, totalCount);
    }

    /// <summary>
    /// 3. Truy vấn thống kê số lượng phiếu sửa chữa theo từng hàng chờ nghiệp vụ.
    /// Đảm bảo tính toán chính xác 100% từ Database theo phân quyền chi nhánh.
    /// </summary>
    public async Task<RepairQueueStatsDto> Handle(GetRepairQueueStatsQuery request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var baseQuery = ticketRepo.GetQueryableAsNoTracking();

        // Fail-Closed Branch Isolation
        if (!_scopeContext.IsEnterpriseScope)
        {
            var userBranchId = _scopeContext.GetRequiredBranchId();
            baseQuery = baseQuery.Where(t => t.BranchId == userBranchId);
        }

        // Ẩn dữ liệu test mặc định
        if (!request.IncludeTest)
        {
            baseQuery = baseQuery.Where(t => !t.IsTest);
        }

        Guid currentUserId = Guid.Empty;
        if (!string.IsNullOrWhiteSpace(_currentUserService?.UserId))
        {
            Guid.TryParse(_currentUserService.UserId, out currentUserId);
        }

        // 1. Chờ nhận việc: Chưa có KTV (hoặc PendingAssignment) và chưa đóng
        var unassignedCount = baseQuery.Count(t =>
            (!t.TechnicianId.HasValue || t.TechnicianId.Value == Guid.Empty || t.Status == RepairTicketStatus.PendingAssignment) &&
            t.Status != RepairTicketStatus.Completed &&
            t.Status != RepairTicketStatus.WaitingPickup &&
            t.Status != RepairTicketStatus.Delivered &&
            t.Status != RepairTicketStatus.Cancelled);

        // 2. Việc của tôi: Thuộc về KTV hiện tại và chưa đóng
        var myTasksCount = currentUserId != Guid.Empty
            ? baseQuery.Count(t =>
                t.TechnicianId.HasValue &&
                t.TechnicianId.Value == currentUserId &&
                t.Status != RepairTicketStatus.Completed &&
                t.Status != RepairTicketStatus.WaitingPickup &&
                t.Status != RepairTicketStatus.Delivered &&
                t.Status != RepairTicketStatus.Cancelled)
            : 0;

        // 3. Đang trong tiến trình sửa chữa
        var inProgressStatuses = new[]
        {
            RepairTicketStatus.Received,
            RepairTicketStatus.Diagnosing,
            RepairTicketStatus.WaitingApproval,
            RepairTicketStatus.WaitingForParts,
            RepairTicketStatus.Repairing,
            RepairTicketStatus.WaitingQC
        };
        var inProgressCount = baseQuery.Count(t => inProgressStatuses.Contains(t.Status));

        // 4. Đã hoàn tất sửa chữa (Đang chờ khách lấy tại cửa hàng) - KHÔNG BAO GỒM Delivered
        var completedCount = baseQuery.Count(t =>
            t.Status == RepairTicketStatus.Completed || t.Status == RepairTicketStatus.WaitingPickup);

        // 5. Đã bàn giao cho khách (Máy đã rời khỏi cửa hàng)
        var deliveredCount = baseQuery.Count(t =>
            t.Status == RepairTicketStatus.Delivered);

        // 6. Tổng số phiếu trong chi nhánh
        var totalCount = baseQuery.Count();

        // 7. Chi tiết các trạng thái kỹ thuật (Đếm trực tiếp từ Database)
        var waitingForPartsCount = baseQuery.Count(t => t.Status == RepairTicketStatus.WaitingForParts);
        var waitingApprovalCount = baseQuery.Count(t => t.Status == RepairTicketStatus.WaitingApproval);
        var diagnosingCount = baseQuery.Count(t => t.Status == RepairTicketStatus.Diagnosing);
        var repairingCount = baseQuery.Count(t => t.Status == RepairTicketStatus.Repairing);
        var waitingQcCount = baseQuery.Count(t => t.Status == RepairTicketStatus.WaitingQC);

        return new RepairQueueStatsDto
        {
            UnassignedCount = unassignedCount,
            MyTasksCount = myTasksCount,
            InProgressCount = inProgressCount,
            CompletedCount = completedCount,
            DeliveredCount = deliveredCount,
            TotalCount = totalCount,
            WaitingForPartsCount = waitingForPartsCount,
            WaitingApprovalCount = waitingApprovalCount,
            DiagnosingCount = diagnosingCount,
            RepairingCount = repairingCount,
            WaitingQcCount = waitingQcCount
        };
    }
}
