using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Repair.Commands;
using PSP.Domain.Common.Constants;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Repair.Handlers;

public class RepairDepositCommandHandlers :
    IRequestHandler<CreateRepairDepositCommand, Guid>,
    IRequestHandler<RefundRepairDepositCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IScopeContextService _scopeContext;
    private readonly INotificationService? _notificationService;

    public RepairDepositCommandHandlers(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IIdempotencyService idempotencyService,
        IScopeContextService scopeContext,
        INotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _idempotencyService = idempotencyService;
        _scopeContext = scopeContext;
        _notificationService = notificationService;
    }

    public async Task<Guid> Handle(CreateRepairDepositCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var depositRepo = _unitOfWork.Repository<RepairDepositEntity>();
        var paymentMethodRepo = _unitOfWork.Repository<PaymentMethodEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();

        if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            throw new BadRequestException("IdempotencyKey là bắt buộc.");

        // Check Idempotency Key existence
        var existingDepositWithKey = await depositRepo.FindAsync(d => d.IdempotencyKey == request.IdempotencyKey, cancellationToken);
        var firstMatch = existingDepositWithKey.FirstOrDefault();
        
        // Calculate a simple payload hash for comparison
        string currentPayloadHash = $"{request.RepairTicketId}_{request.Amount}_{request.PaymentMethodId}";

        if (firstMatch != null)
        {
            if (firstMatch.RequestPayloadHash == currentPayloadHash)
            {
                // Same key + same payload -> return original result
                return firstMatch.Id;
            }
            // Same key + different payload -> Conflict
            throw new ConflictException("IdempotencyKey đã được sử dụng cho một yêu cầu có payload khác.");
        }

        // 1. Validate Ticket
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
            throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);

        // Fail-Closed Scope Check
        _scopeContext.ValidateBranchAccess(ticket.BranchId, "phiếu sửa chữa");

        // Business Rule: Can only collect deposit before completion
        if (ticket.Status == RepairTicketStatus.Completed || ticket.Status == RepairTicketStatus.Cancelled || ticket.Status == RepairTicketStatus.Delivered)
            throw new BadRequestException($"Không thể thu cọc cho phiếu sửa chữa ở trạng thái {ticket.Status}.");

        // Validate amount
        if (request.Amount <= 0)
            throw new BadRequestException("Số tiền cọc phải lớn hơn 0.");

        // Concurrency / Over-limit Rule
        var existingDeposits = await depositRepo.FindAsync(d => d.RepairTicketId == ticket.Id && d.Status != RepairDepositStatus.Refunded && !d.IsDeleted, cancellationToken);
        var totalExisting = existingDeposits.Sum(d => d.Amount);
        if (ticket.EstimatedCost.HasValue && totalExisting + request.Amount > ticket.EstimatedCost.Value)
        {
            throw new BadRequestException("Tổng tiền cọc không được vượt quá Chi phí dự kiến.");
        }

        // Validate Payment Method
        var paymentMethod = await paymentMethodRepo.GetByIdAsync(request.PaymentMethodId, cancellationToken);
        if (paymentMethod == null || !paymentMethod.IsActive)
            throw new BadRequestException("Phương thức thanh toán không hợp lệ hoặc đã bị khóa.");

        // Determine cashier
        if (!Guid.TryParse(_currentUserService.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");

        // 2. Create Deposit Entity
        var deposit = new RepairDepositEntity
        {
            RepairTicketId = request.RepairTicketId,
            Amount = request.Amount,
            PaymentMethodId = request.PaymentMethodId,
            TransactionCode = request.TransactionCode,
            ReceivedById = userId,
            PaidAt = DateTime.UtcNow,
            Status = RepairDepositStatus.Paid,
            IdempotencyKey = request.IdempotencyKey,
            RequestPayloadHash = currentPayloadHash
        };

        // 3. Concurrency Bump: Update Ticket to trigger RowVersion check
        ticket.UpdatedAt = DateTime.UtcNow;
        ticketRepo.Update(ticket);

        await depositRepo.AddAsync(deposit, cancellationToken);

        // Section 15: Ghi nhận sự kiện Audit
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        var cashier = await userRepo.GetByIdAsync(userId, cancellationToken);
        var history = new RepairStatusHistoryEntity
        {
            RepairTicketId = ticket.Id,
            Status = ticket.Status.ToString(),
            Action = "Deposit Collected",
            ActorId = userId,
            ActorName = cashier?.FullName ?? _currentUserService.Username ?? "Thu ngân",
            Note = $"Thu tiền cọc: {request.Amount:N0} đ qua {paymentMethod.Name}.",
            Details = $"DepositId: {deposit.Id}, TransactionCode: {request.TransactionCode}"
        };
        await historyRepo.AddAsync(history, cancellationToken);
        
        try
        {
            _idempotencyService.AttachRecord(deposit.Id);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Dữ liệu phiếu sửa chữa đã bị thay đổi bởi một giao dịch khác. Vui lòng thử lại.");
        }

        return deposit.Id;
    }

    public async Task<bool> Handle(RefundRepairDepositCommand request, CancellationToken cancellationToken)
    {
        var depositRepo = _unitOfWork.Repository<RepairDepositEntity>();
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();

        var deposit = await depositRepo.GetByIdAsync(request.DepositId, cancellationToken);
        if (deposit == null)
            throw new NotFoundException("Khoản cọc", request.DepositId);

        // Fail-Closed Scope Check
        var ticket = await ticketRepo.GetByIdAsync(deposit.RepairTicketId, cancellationToken);
        if (ticket != null)
        {
            _scopeContext.ValidateBranchAccess(ticket.BranchId, "khoản cọc sửa chữa");
        }

        if (deposit.Status == RepairDepositStatus.Applied)
            throw new BadRequestException("Khoản cọc này đã được cấn trừ vào Hóa đơn (Applied). Không thể hoàn tiền trực tiếp, cần hủy Hóa đơn trước.");

        if (deposit.Status == RepairDepositStatus.Refunded)
            throw new BadRequestException("Khoản cọc này đã được hoàn tiền (Refunded).");

        deposit.Status = RepairDepositStatus.Refunded;
        depositRepo.Update(deposit);

        if (ticket != null)
        {
            Guid? actorId = null;
            if (Guid.TryParse(_currentUserService.UserId, out var uid)) actorId = uid;
            var history = new RepairStatusHistoryEntity
            {
                RepairTicketId = ticket.Id,
                Status = ticket.Status.ToString(),
                Action = "Deposit Refunded",
                ActorId = actorId,
                ActorName = _currentUserService.Username ?? "Quản trị viên",
                Note = $"Hoàn tiền cọc: {deposit.Amount:N0} đ cho khách hàng.",
                Details = $"DepositId: {deposit.Id}"
            };
            await historyRepo.AddAsync(history, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_notificationService != null && ticket != null)
        {
            try
            {
                var targetBranch = ticket.BranchId ?? Guid.Empty;
                var managerUserIds = await userRepo.GetQueryableAsNoTracking()
                    .Where(u => u.Status == UserStatus.Active &&
                                (targetBranch == Guid.Empty || u.BranchId == targetBranch || u.BranchId == Guid.Empty) &&
                                u.UserRoles.Any(ur => ur.Role.Name == CanonicalRoles.Manager || ur.Role.Name == CanonicalRoles.Admin || ur.Role.Name == CanonicalRoles.Owner))
                    .Select(u => u.Id)
                    .ToListAsync(cancellationToken);

                foreach (var managerId in managerUserIds)
                {
                    await _notificationService.SendToUserAsync(
                        managerId,
                        $"[Hoàn cọc sửa chữa] Ca {ticket.Code} hoàn cọc {deposit.Amount:N0} đ",
                        $"Khoản tiền cọc {deposit.Amount:N0} đ của ca sửa chữa {ticket.Code} đã được hoàn tiền cho khách hàng. Vui lòng đối soát sổ quỹ chi nhánh.",
                        cancellationToken
                    );
                }
            }
            catch
            {
                // Tránh ngắt quãng giao dịch nếu có sự cố gửi thông báo
            }
        }

        return true;
    }
}
