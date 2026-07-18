using System;
using System.Collections.Generic;
using MediatR;
using PSP.Application.Modules.Sales.DTOs;

namespace PSP.Application.Modules.Sales.Queries;

/// <summary>
/// Các câu hỏi (Queries) dùng để ĐỌC dữ liệu từ bảng Promotions (Chương trình khuyến mãi).
/// 
/// Dành cho người mới học:
/// - Đây là phần "Q" (Query) trong kiến trúc CQRS.
/// - Các lớp này chỉ dùng để đọc thông tin, hoàn toàn không làm thay đổi trạng thái của cơ sở dữ liệu.
/// </summary>

/// <summary>
/// Lấy thông tin chi tiết một chương trình khuyến mãi theo ID.
/// </summary>
public record GetPromotionByIdQuery(Guid Id) : IRequest<PromotionDto>;

/// <summary>
/// Lấy danh sách tất cả các chương trình khuyến mãi trong hệ thống.
/// </summary>
public record GetAllPromotionsQuery : IRequest<IEnumerable<PromotionDto>>;
