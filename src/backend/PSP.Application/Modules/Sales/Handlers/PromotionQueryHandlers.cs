using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các câu hỏi truy vấn (Queries) cho Chương trình khuyến mãi (Promotion).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này sử dụng phương thức "GetByIdAsNoTrackingAsync()" và "GetAllAsNoTrackingAsync()" của Repository để đọc dữ liệu.
/// - "AsNoTracking" thông báo cho CSDL rằng chúng ta chỉ đọc để hiển thị, không cần lưu vào bộ theo dõi giúp tối ưu hiệu năng.
/// - Mapster giúp tự động ánh xạ cấu trúc bảng sang định dạng DTO phẳng.
/// </summary>
public class PromotionQueryHandlers :
    IRequestHandler<GetPromotionByIdQuery, PromotionDto>,
    IRequestHandler<GetAllPromotionsQuery, IEnumerable<PromotionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public PromotionQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Tìm kiếm và trả về thông tin chi tiết một chương trình khuyến mãi theo ID.
    /// </summary>
    public async Task<PromotionDto> Handle(GetPromotionByIdQuery request, CancellationToken cancellationToken)
    {
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        // Tìm khuyến mãi theo Id (không theo dõi)
        var promotion = await promotionRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);

        if (promotion == null)
        {
            throw new NotFoundException("Chương trình khuyến mãi", request.Id);
        }

        // Chuyển đối sang DTO
        return promotion.Adapt<PromotionDto>();
    }

    /// <summary>
    /// Lấy danh sách toàn bộ chương trình khuyến mãi đang hoạt động.
    /// </summary>
    public async Task<IEnumerable<PromotionDto>> Handle(GetAllPromotionsQuery request, CancellationToken cancellationToken)
    {
        var promotionRepo = _unitOfWork.Repository<PromotionEntity>();

        var promotions = await promotionRepo.GetAllAsNoTrackingAsync(cancellationToken);

        return promotions.Adapt<IEnumerable<PromotionDto>>();
    }
}
