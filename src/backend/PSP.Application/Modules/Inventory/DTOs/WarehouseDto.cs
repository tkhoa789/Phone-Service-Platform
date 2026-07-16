using System;

namespace PSP.Application.Modules.Inventory.DTOs;

/// <summary>
/// DTO (Data Transfer Object) chứa thông tin chuyển đổi dữ liệu của Kho hàng (Warehouse).
/// Lớp này dùng để đóng gói dữ liệu trả về cho Client, giúp tối ưu băng thông và ẩn đi các thông tin nhạy cảm.
/// </summary>
public class WarehouseDto
{
    /// <summary>
    /// ID duy nhất của kho hàng (Khóa chính)
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// ID của chi nhánh sở hữu kho hàng này
    /// </summary>
    public Guid BranchId { get; set; }

    /// <summary>
    /// Tên của chi nhánh sở hữu kho hàng này (Được nạp kèm để Client hiển thị trực quan)
    /// </summary>
    public string BranchName { get; set; } = string.Empty;

    /// <summary>
    /// Mã kho hàng (ví dụ: KHO_Q1, KHO_BT)
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Tên gọi trực quan của kho hàng (ví dụ: Kho Quận 1, Kho Bình Thạnh)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Thời gian tạo bản ghi
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
