using System;
using MediatR;

namespace PSP.Application.Modules.Sales.Commands;

/// <summary>
/// Lệnh tạo mới một chương trình khuyến mãi.
/// 
/// Dành cho người mới học:
/// - Đây là một record C# đại diện cho Lệnh (Command) ghi dữ liệu.
/// - Kế thừa IRequest<Guid> tức là sau khi Handler xử lý xong lệnh này, nó phải trả lại cho ta một Guid (ID của chương trình khuyến mãi vừa tạo).
/// </summary>
public record CreatePromotionCommand(
    string Code,
    string Name,
    string Type, // "PERCENTAGE" hoặc "DIRECT_VALUE"
    decimal Value,
    DateTime StartDate,
    DateTime EndDate,
    bool IsActive
) : IRequest<Guid>;

/// <summary>
/// Lệnh cập nhật chương trình khuyến mãi.
/// - Trả về một giá trị boolean (đúng/sai) để xác nhận cập nhật thành công hay không.
/// </summary>
public record UpdatePromotionCommand(
    Guid Id,
    string Name,
    string Type,
    decimal Value,
    DateTime StartDate,
    DateTime EndDate,
    bool IsActive
) : IRequest<bool>;

/// <summary>
/// Lệnh xóa chương trình khuyến mãi (Xóa mềm - Soft Delete).
/// </summary>
public record DeletePromotionCommand(Guid Id) : IRequest<bool>;
