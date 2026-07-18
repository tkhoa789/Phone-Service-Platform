using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) liên quan đến Chương trình khuyến mãi (Promotion).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này hiện thực giao diện IRequestHandler của MediatR để đón nhận và xử lý các lệnh: tạo, sửa, xóa khuyến mãi.
/// - IUnitOfWork được bơm vào qua Constructor để giao tiếp và lưu trữ xuống database.
/// </summary>
public class PromotionCommandHandlers :
    IRequestHandler<CreatePromotionCommand, Guid>,
    IRequestHandler<UpdatePromotionCommand, bool>,
    IRequestHandler<DeletePromotionCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public PromotionCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới chương trình khuyến mãi.
    /// </summary>
    public async Task<Guid> Handle(CreatePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Kiểm tra ngày bắt đầu phải trước ngày kết thúc
        if (request.StartDate >= request.EndDate)
        {
            throw new BadRequestException("Ngày bắt đầu chương trình khuyến mãi phải trước ngày kết thúc.");
        }

        // 2. Kiểm tra trùng mã khuyến mãi (Code)
        var existing = await promotionRepo.FindAsync(x => x.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Mã khuyến mãi '{request.Code}' đã tồn tại trong hệ thống.");
        }

        // 3. Map dữ liệu từ Command sang Entity để chuẩn bị lưu DB
        var promotion = request.Adapt<PromotionEntity>();

        // 4. Thêm và lưu
        await promotionRepo.AddAsync(promotion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return promotion.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin chương trình khuyến mãi.
    /// </summary>
    public async Task<bool> Handle(UpdatePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Tìm bản ghi khuyến mãi cũ trong DB
        var promotion = await promotionRepo.GetByIdAsync(request.Id, cancellationToken);
        if (promotion == null)
        {
            throw new NotFoundException("Chương trình khuyến mãi", request.Id);
        }

        // 2. Kiểm tra tính hợp lệ của ngày tháng
        if (request.StartDate >= request.EndDate)
        {
            throw new BadRequestException("Ngày bắt đầu chương trình khuyến mãi phải trước ngày kết thúc.");
        }

        // 3. Cập nhật dữ liệu từ request lên thực thể cũ (ngoại trừ cột Code được giữ nguyên)
        request.Adapt(promotion);

        promotionRepo.Update(promotion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm chương trình khuyến mãi.
    /// </summary>
    public async Task<bool> Handle(DeletePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Kiểm tra xem khuyến mãi có tồn tại không
        var promotion = await promotionRepo.GetByIdAsync(request.Id, cancellationToken);
        if (promotion == null)
        {
            throw new NotFoundException("Chương trình khuyến mãi", request.Id);
        }

        // 2. [RÀNG BUỘC NGHIỆP VỤ AN TOÀN]: Không được xóa khuyến mãi nếu đang có Voucher liên kết hoạt động.
        // Tìm xem có voucher nào thuộc về chương trình khuyến mãi này mà chưa bị xóa mềm không.
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var linkedVouchers = await voucherRepo.FindAsync(x => x.PromotionId == request.Id, cancellationToken);
        
        if (linkedVouchers.Any())
        {
            throw new BadRequestException("Không thể xóa chương trình khuyến mãi này vì đang có các mã Voucher liên kết hoạt động.");
        }

        // 3. Tiến hành xóa mềm (gán IsDeleted = true thông qua hàm Remove)
        promotionRepo.Remove(promotion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
