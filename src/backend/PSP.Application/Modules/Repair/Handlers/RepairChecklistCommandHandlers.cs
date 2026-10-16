using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Application.Modules.Repair.Handlers;

public class RepairChecklistCommandHandlers :
    IRequestHandler<Commands.CreateRepairChecklistCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public RepairChecklistCommandHandlers(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IScopeContextService? scopeContext = null)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext ?? new ScopeContextService(currentUserService);
    }

    public async Task<Guid> Handle(Commands.CreateRepairChecklistCommand request, CancellationToken cancellationToken)
    {
        var ticketRepo = _unitOfWork.Repository<RepairTicketEntity>();
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var checklistRepo = _unitOfWork.Repository<RepairChecklistEntity>();

        // 1. Kiểm tra RepairTicket
        var ticket = await ticketRepo.GetByIdAsync(request.RepairTicketId, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Phiếu sửa chữa", request.RepairTicketId);
        }

        // 2. Fail-Closed Scope Check
        var effectiveTicketBranchId = ticket.BranchId;
        if (!effectiveTicketBranchId.HasValue && ticket.ReceivedById != Guid.Empty)
        {
            var receivedByUser = await userRepo.GetByIdAsync(ticket.ReceivedById, cancellationToken);
            effectiveTicketBranchId = receivedByUser?.BranchId;
        }
        _scopeContext.ValidateBranchAccess(effectiveTicketBranchId, "phiếu sửa chữa");

        Guid inspectorId = Guid.Empty;
        if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var parsedGuid))
        {
            inspectorId = parsedGuid;
        }
        else
        {
            throw new BadRequestException("Không thể xác định thông tin nhân viên kiểm tra.");
        }

        // 3. Prevent duplicate checklists of the same type for a ticket
        var existingChecklists = await checklistRepo.FindAsync(c => c.RepairTicketId == ticket.Id && c.Type == request.Type && !c.IsDeleted, cancellationToken);
        if (existingChecklists.Any())
        {
            throw new BadRequestException($"Phiếu sửa chữa đã tồn tại biên bản kiểm tra loại {request.Type}. Không thể tạo thêm.");
        }

        // 4. Validate items (must have exactly 8 items based on our business rule)
        if (request.Items == null || request.Items.Count != 8)
        {
            throw new BadRequestException("Biên bản kiểm tra phải có chính xác 8 hạng mục theo tiêu chuẩn.");
        }

        var requiredPoints = new[] { "Display", "Touch", "FaceID", "Camera", "Speakers", "Charging", "Wifi", "Body" };
        var providedPoints = request.Items.Select(i => i.CheckPointName).ToList();

        if (!requiredPoints.All(p => providedPoints.Contains(p)))
        {
            throw new BadRequestException("Các hạng mục kiểm tra không khớp với tiêu chuẩn 8-point checklist.");
        }

        var checklist = new RepairChecklistEntity
        {
            RepairTicketId = request.RepairTicketId,
            Type = request.Type,
            InspectorId = inspectorId,
            InspectedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CustomerSignatureUrl = request.CustomerSignatureUrl,
            Items = request.Items.Select(i => new RepairChecklistItemEntity
            {
                CheckPointName = i.CheckPointName,
                IsPassed = i.IsPassed,
                IssueDescription = i.IssueDescription
            }).ToList()
        };

        await checklistRepo.AddAsync(checklist, cancellationToken);

        // Section 10: Xử lý quy trình QC nếu là Check-Out Checklist
        var historyRepo = _unitOfWork.Repository<RepairStatusHistoryEntity>();
        var user = await userRepo.GetByIdAsync(inspectorId, cancellationToken);
        var actorName = user?.FullName ?? _currentUserService.Username ?? "Kỹ thuật viên";

        if (request.Type == RepairChecklistType.CheckOut)
        {
            bool allPassed = request.Items.All(i => i.IsPassed);
            if (allPassed)
            {
                // QC đạt: WaitingQC -> Completed (hoặc sẵn sàng hoàn tất)
                if (ticket.Status == RepairTicketStatus.Repairing || ticket.Status == RepairTicketStatus.WaitingQC)
                {
                    ticket.Status = RepairTicketStatus.Completed;
                    ticket.CompletedDate = DateTime.UtcNow;
                    ticketRepo.Update(ticket);
                }

                var history = new RepairStatusHistoryEntity
                {
                    RepairTicketId = ticket.Id,
                    Status = ticket.Status.ToString(),
                    Action = "QC Completed",
                    ActorId = inspectorId,
                    ActorName = actorName,
                    Note = "Kiểm định QC Check-Out ĐẠT chất lượng. Máy đã sẵn sàng bàn giao.",
                    Details = request.Notes
                };
                await historyRepo.AddAsync(history, cancellationToken);
            }
            else
            {
                // QC không đạt: Chuyển lại Repairing để kỹ thuật viên khắc phục
                var failedItems = request.Items.Where(i => !i.IsPassed).Select(i => $"{i.CheckPointName}: {i.IssueDescription}").ToList();
                ticket.Status = RepairTicketStatus.Repairing;
                ticketRepo.Update(ticket);

                var history = new RepairStatusHistoryEntity
                {
                    RepairTicketId = ticket.Id,
                    Status = ticket.Status.ToString(),
                    Action = "QC Completed",
                    ActorId = inspectorId,
                    ActorName = actorName,
                    Note = $"Kiểm định QC Check-Out KHÔNG ĐẠT. Máy được chuyển về trạng thái Đang sửa chữa.",
                    Details = $"Các lỗi chưa đạt: {string.Join("; ", failedItems)}. Ghi chú: {request.Notes}"
                };
                await historyRepo.AddAsync(history, cancellationToken);
            }
        }
        else
        {
            // Check-In Checklist
            var history = new RepairStatusHistoryEntity
            {
                RepairTicketId = ticket.Id,
                Status = ticket.Status.ToString(),
                Action = "CheckIn Checklist Created",
                ActorId = inspectorId,
                ActorName = actorName,
                Note = "Biên bản kiểm tra tiếp nhận ban đầu (Check-In) đã được xác nhận.",
                Details = request.Notes
            };
            await historyRepo.AddAsync(history, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return checklist.Id;
    }
}
