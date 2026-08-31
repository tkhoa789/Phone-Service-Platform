using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) ghi dữ liệu cho thực thể Voucher (Mã giảm giá).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Class này chứa logic nghiệp vụ chính (Business Logic) khi tạo, sửa, xóa mã Voucher.
/// - Các ràng buộc quan trọng như kiểm tra chương trình khuyến mãi cha, kiểm tra trùng lặp mã code,
///   và kiểm tra điều kiện xóa an toàn đều được thực hiện tại đây.
/// - Thay thế BusinessException (abstract) thành BadRequestException để hệ thống hiểu và trả về HTTP 400.
/// </summary>
public class VoucherCommandHandlers :
    IRequestHandler<CreateVoucherCommand, Guid>,
    IRequestHandler<UpdateVoucherCommand, bool>,
    IRequestHandler<DeleteVoucherCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public VoucherCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới một mã Voucher giảm giá.
    /// </summary>
    public async Task<Guid> Handle(CreateVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Kiểm tra và tự động gán Chương trình Khuyến mãi mặc định nếu không truyền PromotionId
        PromotionEntity? promotion = null;
        if (request.PromotionId == Guid.Empty)
        {
            var promotions = await promotionRepo.FindAsync(p => p.Code == "GENERAL_PROMO", cancellationToken);
            promotion = promotions.FirstOrDefault();
            if (promotion == null)
            {
                promotion = new PromotionEntity
                {
                    Id = Guid.NewGuid(),
                    Code = "GENERAL_PROMO",
                    Name = "Chương trình Khuyến mãi Phát hành Voucher Trực tiếp",
                    Type = "GENERAL",
                    Value = 0,
                    StartDate = DateTime.UtcNow.AddYears(-1),
                    EndDate = DateTime.UtcNow.AddYears(10),
                    IsActive = true,
                    CreatedBy = "SYSTEM"
                };
                await promotionRepo.AddAsync(promotion, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            promotion = await promotionRepo.GetByIdAsync(request.PromotionId, cancellationToken);
            if (promotion == null)
            {
                throw new NotFoundException("Chương trình khuyến mãi", request.PromotionId);
            }

            if (!promotion.IsActive)
            {
                throw new BadRequestException($"Chương trình khuyến mãi '{promotion.Name}' đã bị ngừng hoạt động.");
            }

            // Bắt buộc tính toán hạn sử dụng voucher đến cuối ngày 23:59:59 trên Server (BR-1104 & BUS-004)
            var actualExpiryDate = request.ExpiryDate.Date.AddDays(1).AddTicks(-1);

            if (actualExpiryDate > promotion.EndDate)
            {
                throw new BadRequestException("Hạn sử dụng của Voucher không được vượt quá ngày kết thúc của chương trình khuyến mãi.");
            }
        }

        var finalExpiryDate = request.ExpiryDate.Date.AddDays(1).AddTicks(-1);
        if (finalExpiryDate <= DateTime.UtcNow)
        {
            throw new BadRequestException("Hạn sử dụng của Voucher phải ở trong tương lai.");
        }

        // 4. Kiểm tra trùng lặp mã Code Voucher (ví dụ không cho tạo hai mã "VIP100K")
        var existing = await voucherRepo.FindAsync(x => x.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Mã Voucher '{request.Code}' đã tồn tại trong hệ thống.");
        }

        // 5. Kiểm tra giá trị giảm giá và giá trị đơn hàng tối thiểu
        if (request.DiscountAmount <= 0)
        {
            throw new BadRequestException("Số tiền giảm giá của Voucher phải lớn hơn 0.");
        }

        if (request.MinOrderValue < 0)
        {
            throw new BadRequestException("Giá trị đơn hàng tối thiểu để áp dụng Voucher không được âm.");
        }

        if (request.UsageLimit <= 0)
        {
            throw new BadRequestException("Giới hạn số lần sử dụng của Voucher phải tối thiểu là 1.");
        }

        // 6. Map dữ liệu và gán các trạng thái mặc định ban đầu
        var voucher = request.Adapt<VoucherEntity>();
        voucher.ExpiryDate = finalExpiryDate; // Fix Trust Boundary (Client sets Voucher Expiry)
        voucher.PromotionId = promotion.Id;
        voucher.Status = VoucherStatus.Active;
        voucher.UsageCount = 0; // Mới tạo thì chưa ai dùng

        // 7. Lưu vào cơ sở dữ liệu
        await voucherRepo.AddAsync(voucher, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return voucher.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin Voucher.
    /// </summary>
    public async Task<bool> Handle(UpdateVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();

        // 1. Tìm bản ghi Voucher cần cập nhật
        var voucher = await voucherRepo.GetByIdAsync(request.Id, cancellationToken);
        if (voucher == null)
        {
            throw new NotFoundException("Voucher", request.Id);
        }

        // 2. Nếu thay đổi hạn sử dụng, kiểm tra so với chương trình khuyến mãi cha
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();
        var promotion = await promotionRepo.GetByIdAsync(voucher.PromotionId, cancellationToken);
        var finalExpiryDate = request.ExpiryDate.Date.AddDays(1).AddTicks(-1); // BR-1104

        if (promotion != null && finalExpiryDate > promotion.EndDate)
        {
            throw new BadRequestException("Hạn sử dụng mới của Voucher không được vượt quá ngày kết thúc của chương trình khuyến mãi.");
        }

        if (finalExpiryDate <= DateTime.UtcNow)
        {
            throw new BadRequestException("Hạn sử dụng mới của Voucher phải ở trong tương lai.");
        }

        // 3. Kiểm tra các con số tài chính hợp lệ
        if (request.DiscountAmount <= 0)
        {
            throw new BadRequestException("Số tiền giảm giá của Voucher phải lớn hơn 0.");
        }

        if (request.MinOrderValue < 0)
        {
            throw new BadRequestException("Giá trị đơn hàng tối thiểu để áp dụng Voucher không được âm.");
        }

        if (request.UsageLimit < voucher.UsageCount)
        {
            throw new BadRequestException($"Giới hạn số lần sử dụng mới ({request.UsageLimit}) không được nhỏ hơn số lần đã dùng thực tế ({voucher.UsageCount}).");
        }

        // 4. Map ghi đè thuộc tính mới lên thực thể cũ (Code giữ nguyên)
        request.Adapt(voucher);
        voucher.ExpiryDate = finalExpiryDate; // Fix Trust Boundary

        voucherRepo.Update(voucher);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm Voucher.
    /// </summary>
    public async Task<bool> Handle(DeleteVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();

        var voucher = await voucherRepo.GetByIdAsync(request.Id, cancellationToken);
        if (voucher == null)
        {
            throw new NotFoundException("Voucher", request.Id);
        }

        // [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU GIAO DỊCH]:
        // Nếu mã Voucher này đã được khách hàng áp dụng thành công vào một đơn hàng bất kỳ (UsageCount > 0)
        // thì KHÔNG được phép xóa nữa, để tránh mất dấu vết lịch sử giao dịch kế toán.
        if (voucher.UsageCount > 0)
        {
            throw new BadRequestException("Không thể xóa Voucher này vì mã giảm giá đã phát sinh giao dịch thực tế.");
        }

        // Xóa mềm
        voucherRepo.Remove(voucher);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
