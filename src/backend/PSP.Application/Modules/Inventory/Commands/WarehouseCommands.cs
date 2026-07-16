using MediatR;
using System;

namespace PSP.Application.Modules.Inventory.Commands;

/// <summary>
/// COMMAND tạo mới một kho hàng (Warehouse).
/// Triển khai IRequest<Guid> để yêu cầu MediatR trả về Guid của kho hàng mới sau khi thêm thành công.
/// </summary>
public record CreateWarehouseCommand : IRequest<Guid>
{
    /// <summary>
    /// ID của chi nhánh sở hữu kho hàng
    /// </summary>
    public Guid BranchId { get; init; }

    /// <summary>
    /// Mã kho hàng (không được trùng lặp, tối đa 30 ký tự)
    /// </summary>
    public string Code { get; init; } = string.Empty;

    /// <summary>
    /// Tên gọi trực quan của kho hàng (tối đa 100 ký tự)
    /// </summary>
    public string Name { get; init; } = string.Empty;
}

/// <summary>
/// COMMAND cập nhật thông tin kho hàng hiện có.
/// Triển khai IRequest<bool> để trả về kết quả thành công (true/false).
/// </summary>
public record UpdateWarehouseCommand : IRequest<bool>
{
    /// <summary>
    /// ID của kho hàng cần cập nhật (Bắt buộc khớp với ID trên URL API)
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Tên mới của kho hàng
    /// </summary>
    public string Name { get; init; } = string.Empty;
}

/// <summary>
/// COMMAND xóa mềm một kho hàng.
/// Triển khai IRequest<bool> để trả về kết quả thành công.
/// </summary>
public record DeleteWarehouseCommand(Guid Id) : IRequest<bool>;
