using System;
using System.Linq;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Notification.Commands;
using PSP.Domain.Modules.Notification.Entities;

namespace PSP.Application.Modules.Notification.Handlers;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, Guid>
{
    private readonly INotificationService _notificationService;

    public SendNotificationCommandHandler(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task<Guid> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        return await _notificationService.SendToUserAsync(request.UserId, request.Title, request.Content, cancellationToken);
    }
}

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MarkNotificationAsReadCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (notification == null)
            return false;

        notification.IsRead = true;
        _notificationRepository.Update(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

public class MarkAllNotificationsAsReadCommandHandler : IRequestHandler<MarkAllNotificationsAsReadCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public MarkAllNotificationsAsReadCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(MarkAllNotificationsAsReadCommand request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return false;

        var currentUserId = Guid.Parse(currentUserIdStr);
        var unreadNotifications = await _notificationRepository.FindAsync(n => n.UserId == currentUserId && !n.IsRead, cancellationToken);

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            _notificationRepository.Update(notification);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeleteNotificationCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteNotificationCommand request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return false;

        var currentUserId = Guid.Parse(currentUserIdStr);
        var notification = await _notificationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (notification == null || notification.UserId != currentUserId)
            return false;

        _notificationRepository.Remove(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class ClearAllNotificationsCommandHandler : IRequestHandler<ClearAllNotificationsCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ClearAllNotificationsCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ClearAllNotificationsCommand request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return false;

        var currentUserId = Guid.Parse(currentUserIdStr);
        var notifications = await _notificationRepository.FindAsync(n => n.UserId == currentUserId, cancellationToken);
        foreach (var n in notifications)
        {
            _notificationRepository.Remove(n);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class PermanentDeleteNotificationCommandHandler : IRequestHandler<PermanentDeleteNotificationCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public PermanentDeleteNotificationCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(PermanentDeleteNotificationCommand request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return false;

        var currentUserId = Guid.Parse(currentUserIdStr);
        var notification = await _notificationRepository.FindFirstIgnoreQueryFiltersAsync(
            n => n.Id == request.Id && n.UserId == currentUserId,
            cancellationToken
        );

        if (notification == null)
            return false;

        _notificationRepository.HardRemove(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class ClearTrashNotificationsCommandHandler : IRequestHandler<ClearTrashNotificationsCommand, bool>
{
    private readonly IRepository<NotificationEntity> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ClearTrashNotificationsCommandHandler(
        IRepository<NotificationEntity> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ClearTrashNotificationsCommand request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr))
            return false;

        var currentUserId = Guid.Parse(currentUserIdStr);
        var trashNotifications = await _notificationRepository.GetQueryable()
            .IgnoreQueryFilters()
            .Where(n => n.UserId == currentUserId && n.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var n in trashNotifications)
        {
            _notificationRepository.HardRemove(n);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class UploadFileAttachmentCommandHandler : IRequestHandler<UploadFileAttachmentCommand, Guid>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly IRepository<FileAttachmentEntity> _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;

    public UploadFileAttachmentCommandHandler(
        IFileStorageService fileStorageService,
        IRepository<FileAttachmentEntity> attachmentRepository,
        IUnitOfWork unitOfWork,
        IScopeContextService scopeContext)
    {
        _fileStorageService = fileStorageService;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    public async Task<Guid> Handle(UploadFileAttachmentCommand request, CancellationToken cancellationToken)
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

        // 1. Upload file vật lý lên disk
        var filePath = await _fileStorageService.UploadFileAsync(
            request.FileStream, 
            request.FileName, 
            request.ContentType, 
            cancellationToken);

        // 2. Lưu thông tin vào database
        var attachment = new FileAttachmentEntity
        {
            EntityName = request.EntityName,
            EntityId = request.EntityId,
            FilePath = filePath,
            FileType = request.ContentType,
            FileSize = (int)request.FileSize
        };

        await _attachmentRepository.AddAsync(attachment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return attachment.Id;
    }
}

public class DeleteFileAttachmentCommandHandler : IRequestHandler<DeleteFileAttachmentCommand, bool>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly IRepository<FileAttachmentEntity> _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScopeContextService _scopeContext;

    public DeleteFileAttachmentCommandHandler(
        IFileStorageService fileStorageService,
        IRepository<FileAttachmentEntity> attachmentRepository,
        IUnitOfWork unitOfWork,
        IScopeContextService scopeContext)
    {
        _fileStorageService = fileStorageService;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    public async Task<bool> Handle(DeleteFileAttachmentCommand request, CancellationToken cancellationToken)
    {
        var attachment = await _attachmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (attachment == null)
            return false;

        // Scope Isolation Check (Fail-Closed)
        if (!_scopeContext.IsEnterpriseScope)
        {
            if (attachment.EntityName == "RepairTicket") 
            {
                var repairRepo = _unitOfWork.Repository<PSP.Domain.Modules.Repair.Entities.RepairTicketEntity>();
                var repair = await repairRepo.GetByIdAsNoTrackingAsync(attachment.EntityId, cancellationToken);
                if (repair != null) 
                {
                    _scopeContext.ValidateBranchAccess(repair.BranchId, "phiếu sửa chữa");
                }
            }
            else if (attachment.EntityName == "SalesOrder") 
            {
                var salesOrderRepo = _unitOfWork.Repository<PSP.Domain.Modules.Sales.Entities.SalesOrderEntity>();
                var order = await salesOrderRepo.GetByIdAsNoTrackingAsync(attachment.EntityId, cancellationToken);
                if (order != null) 
                {
                    _scopeContext.ValidateBranchAccess(order.BranchId, "đơn hàng");
                }
            }
        }

        // 1. Xóa file vật lý trên ổ đĩa
        await _fileStorageService.DeleteFileAsync(attachment.FilePath, cancellationToken);

        // 2. Xóa bản ghi trong database
        _attachmentRepository.Remove(attachment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
