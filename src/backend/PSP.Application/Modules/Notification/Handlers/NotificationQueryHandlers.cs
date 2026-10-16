using System;
using System.Linq;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Notification.Queries;
using PSP.Application.Modules.Notification.DTOs;
using PSP.Domain.Modules.Notification.Entities;

namespace PSP.Application.Modules.Notification.Handlers;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, (IEnumerable<NotificationDto> Items, int TotalCount)>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetMyNotificationsQueryHandler(
        IRepository<NotificationEntity> notificationRepository,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _currentUserService = currentUserService;
    }

    public async Task<(IEnumerable<NotificationDto> Items, int TotalCount)> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return (Enumerable.Empty<NotificationDto>(), 0);

        var currentUserId = Guid.Parse(currentUserIdStr);
        
        var notifications = (await _notificationRepository.FindAsync(n => n.UserId == currentUserId, cancellationToken))
            .OrderByDescending(n => n.CreatedAt)
            .ToList();

        var totalCount = notifications.Count;

        var items = notifications
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.UserId,
                n.Title,
                n.Content,
                n.IsRead,
                n.CreatedAt
            ))
            .ToList();

        return (items, totalCount);
    }
}

public class GetUnreadNotificationCountQueryHandler : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetUnreadNotificationCountQueryHandler(
        IRepository<NotificationEntity> notificationRepository,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _currentUserService = currentUserService;
    }

    public async Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return 0;

        var currentUserId = Guid.Parse(currentUserIdStr);

        var unreadNotifications = await _notificationRepository.FindAsync(n => n.UserId == currentUserId && !n.IsRead, cancellationToken);
        return unreadNotifications.Count();
    }
}

public class GetTrashNotificationsQueryHandler : IRequestHandler<GetTrashNotificationsQuery, (IEnumerable<NotificationDto> Items, int TotalCount)>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetTrashNotificationsQueryHandler(
        IRepository<NotificationEntity> notificationRepository,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _currentUserService = currentUserService;
    }

    public async Task<(IEnumerable<NotificationDto> Items, int TotalCount)> Handle(GetTrashNotificationsQuery request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return (Enumerable.Empty<NotificationDto>(), 0);

        var currentUserId = Guid.Parse(currentUserIdStr);

        var query = _notificationRepository.GetQueryable()
            .IgnoreQueryFilters()
            .Where(n => n.UserId == currentUserId && n.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var notifications = await query
            .OrderByDescending(n => n.DeletedAt ?? n.CreatedAt)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.UserId,
                n.Title,
                n.Content,
                n.IsRead,
                n.CreatedAt,
                n.DeletedAt
            ))
            .ToListAsync(cancellationToken);

        return (notifications, totalCount);
    }
}

public class GetFileAttachmentsByEntityQueryHandler : IRequestHandler<GetFileAttachmentsByEntityQuery, IEnumerable<FileAttachmentDto>>
{
    private readonly IRepository<FileAttachmentEntity> _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;

    public GetFileAttachmentsByEntityQueryHandler(
        IRepository<FileAttachmentEntity> attachmentRepository,
        IUnitOfWork unitOfWork,
        IScopeContextService scopeContext)
    {
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    public async Task<IEnumerable<FileAttachmentDto>> Handle(GetFileAttachmentsByEntityQuery request, CancellationToken cancellationToken)
    {
        // Scope Isolation Check (Fail-Closed)
        if (!_scopeContext.IsEnterpriseScope)
        {
            if (request.EntityName == "RepairTicket") 
            {
                var repairRepo = _unitOfWork.Repository<PSP.Domain.Modules.Repair.Entities.RepairTicketEntity>();
                var repair = await repairRepo.GetByIdAsNoTrackingAsync(request.EntityId, cancellationToken);
                if (repair != null) 
                {
                    _scopeContext.ValidateBranchAccess(repair.BranchId, "phiếu sửa chữa");
                }
            }
            else if (request.EntityName == "SalesOrder") 
            {
                var salesOrderRepo = _unitOfWork.Repository<PSP.Domain.Modules.Sales.Entities.SalesOrderEntity>();
                var order = await salesOrderRepo.GetByIdAsNoTrackingAsync(request.EntityId, cancellationToken);
                if (order != null) 
                {
                    _scopeContext.ValidateBranchAccess(order.BranchId, "đơn hàng");
                }
            }
        }

        var attachments = await _attachmentRepository.FindAsync(
            f => f.EntityName == request.EntityName && f.EntityId == request.EntityId, 
            cancellationToken);

        var items = attachments
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FileAttachmentDto(
                f.Id,
                f.EntityName,
                f.EntityId,
                f.FilePath,
                f.FileType,
                f.FileSize,
                f.CreatedAt
            ))
            .ToList();

        return items;
    }
}
