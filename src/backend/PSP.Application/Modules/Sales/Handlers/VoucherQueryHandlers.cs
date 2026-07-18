using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các truy vấn (Queries) cho Voucher (Mã giảm giá).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này xử lý việc lấy dữ liệu chi tiết, danh sách voucher.
/// - Đặc biệt là xử lý logic nghiệp vụ quan trọng "ValidateVoucherQuery" để kiểm tra xem một Voucher có đủ điều kiện áp dụng cho hóa đơn hiện tại của khách hàng hay không.
/// - Để tránh dùng EF Core trực tiếp ở tầng Application, ta nạp các bảng liên quan riêng rẽ rồi ghép chúng lại ở bộ nhớ RAM.
/// - Sử dụng BadRequestException (lỗi 400) thay vì BusinessException khi phát hiện vi phạm nghiệp vụ.
/// </summary>
public class VoucherQueryHandlers :
    IRequestHandler<GetVoucherByIdQuery, VoucherDto>,
    IRequestHandler<GetVoucherByCodeQuery, VoucherDto>,
    IRequestHandler<GetAllVouchersQuery, IEnumerable<VoucherDto>>,
    IRequestHandler<ValidateVoucherQuery, VoucherDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public VoucherQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy chi tiết Voucher bằng ID.
    /// </summary>
    public async Task<VoucherDto> Handle(GetVoucherByIdQuery request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Tìm bản ghi Voucher
        var voucher = await voucherRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (voucher == null)
        {
            throw new NotFoundException("Voucher", request.Id);
        }

        // 2. Tìm thông tin chương trình khuyến mãi cha tương ứng
        var promotion = await promotionRepo.GetByIdAsNoTrackingAsync(voucher.PromotionId, cancellationToken);

        // 3. Đóng gói phẳng thành DTO gửi về
        var dto = voucher.Adapt<VoucherDto>();
        if (promotion != null)
        {
            dto = dto with 
            { 
                PromotionCode = promotion.Code, 
                PromotionName = promotion.Name 
            };
        }

        return dto;
    }

    /// <summary>
    /// Tìm kiếm Voucher theo mã Code (ví dụ nhập: "GIAM100K").
    /// </summary>
    public async Task<VoucherDto> Handle(GetVoucherByCodeQuery request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Tìm bản ghi Voucher theo code
        var vouchers = await voucherRepo.FindAsNoTrackingAsync(x => x.Code == request.Code, cancellationToken);
        var voucher = vouchers.FirstOrDefault();

        if (voucher == null)
        {
            throw new BadRequestException($"Không tìm thấy mã giảm giá '{request.Code}' trong hệ thống.");
        }

        // 2. Tìm chương trình khuyến mãi tương ứng
        var promotion = await promotionRepo.GetByIdAsNoTrackingAsync(voucher.PromotionId, cancellationToken);

        // 3. Đóng gói gửi đi
        var dto = voucher.Adapt<VoucherDto>();
        if (promotion != null)
        {
            dto = dto with 
            { 
                PromotionCode = promotion.Code, 
                PromotionName = promotion.Name 
            };
        }

        return dto;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ mã Voucher.
    /// </summary>
    public async Task<IEnumerable<VoucherDto>> Handle(GetAllVouchersQuery request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Lấy toàn bộ Voucher và toàn bộ Promotion dưới dạng NoTracking
        var vouchers = await voucherRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var promotions = await promotionRepo.GetAllAsNoTrackingAsync(cancellationToken);

        // 2. Gom danh mục khuyến mãi thành Dictionary để tìm kiếm nhanh O(1)
        var promotionDict = promotions.ToDictionary(p => p.Id);

        // 3. Ghép nối dữ liệu và trả về danh sách DTO
        var list = vouchers.Select(v =>
        {
            var dto = v.Adapt<VoucherDto>();
            if (promotionDict.TryGetValue(v.PromotionId, out var p))
            {
                dto = dto with 
                { 
                    PromotionCode = p.Code, 
                    PromotionName = p.Name 
                };
            }
            return dto;
        }).ToList();

        return list;
    }

    /// <summary>
    /// KIỂM TRA TÍNH HỢP LỆ CỦA VOUCHER (Nghiệp vụ cốt lõi).
    /// </summary>
    public async Task<VoucherDto> Handle(ValidateVoucherQuery request, CancellationToken cancellationToken)
    {
        var voucherRepo = _unitOfWork.Repository<VoucherEntity>();
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // 1. Tìm Voucher theo Code
        var vouchers = await voucherRepo.FindAsNoTrackingAsync(x => x.Code == request.Code, cancellationToken);
        var voucher = vouchers.FirstOrDefault();

        // 2. Không tìm thấy mã
        if (voucher == null)
        {
            throw new BadRequestException($"Mã giảm giá '{request.Code}' không tồn tại hoặc đã bị xóa.");
        }

        // 3. Kiểm tra trạng thái của Voucher
        if (voucher.Status != VoucherStatus.Active)
        {
            throw new BadRequestException($"Mã giảm giá '{request.Code}' không thể sử dụng (Trạng thái hiện tại: {voucher.Status}).");
        }

        // 4. Kiểm tra hạn sử dụng của Voucher
        if (voucher.ExpiryDate <= DateTime.UtcNow)
        {
            throw new BadRequestException($"Mã giảm giá '{request.Code}' đã hết hạn sử dụng vào ngày {voucher.ExpiryDate.ToLocalTime():dd/MM/yyyy HH:mm}.");
        }

        // 5. Kiểm tra giới hạn số lần sử dụng của Voucher
        if (voucher.UsageCount >= voucher.UsageLimit)
        {
            throw new BadRequestException($"Mã giảm giá '{request.Code}' đã hết lượt sử dụng (Giới hạn: {voucher.UsageLimit} lần).");
        }

        // 6. Kiểm tra giá trị tối thiểu của đơn hàng
        if (request.OrderValue < voucher.MinOrderValue)
        {
            throw new BadRequestException($"Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá này (Cần tối thiểu {voucher.MinOrderValue:N0} VND, đơn hàng hiện tại là {request.OrderValue:N0} VND).");
        }

        // 7. Tìm chương trình khuyến mãi cha
        var promotion = await promotionRepo.GetByIdAsNoTrackingAsync(voucher.PromotionId, cancellationToken);
        if (promotion == null)
        {
            throw new BadRequestException("Mã giảm giá này không liên kết với chương trình khuyến mãi hợp lệ nào.");
        }

        if (!promotion.IsActive)
        {
            throw new BadRequestException($"Chương trình khuyến mãi '{promotion.Name}' đi kèm mã này đã ngừng kích hoạt.");
        }

        var now = DateTime.UtcNow;
        if (now < promotion.StartDate)
        {
            throw new BadRequestException($"Chương trình khuyến mãi '{promotion.Name}' chưa bắt đầu (Thời gian bắt đầu: {promotion.StartDate.ToLocalTime():dd/MM/yyyy HH:mm}).");
        }

        if (now > promotion.EndDate)
        {
            throw new BadRequestException($"Chương trình khuyến mãi '{promotion.Name}' đã kết thúc vào ngày {promotion.EndDate.ToLocalTime():dd/MM/yyyy HH:mm}.");
        }

        // 8. Nếu tất cả đều hợp lệ, trả về DTO hoàn chỉnh
        var dto = voucher.Adapt<VoucherDto>();
        dto = dto with 
        { 
            PromotionCode = promotion.Code, 
            PromotionName = promotion.Name 
        };

        return dto;
    }
}
