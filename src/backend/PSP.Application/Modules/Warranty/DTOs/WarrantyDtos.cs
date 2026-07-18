using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Warranty.DTOs;

/// <summary>
/// DTO đại diện cho Phiếu bảo hành.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này định dạng dữ liệu trả về cho Client.
/// - Tránh trả trực tiếp Entity để ngăn ngừa lỗi vòng lặp tham chiếu và ẩn thông tin nhạy cảm.
/// </summary>
public class WarrantyTicketDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    public Guid? SalesOrderId { get; set; }
    public string? SalesOrderCode { get; set; }

    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;

    public string? Imei { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }

    public List<WarrantyHistoryDto> Histories { get; set; } = new();
}

/// <summary>
/// DTO đại diện cho Lịch sử xử lý bảo hành.
/// </summary>
public class WarrantyHistoryDto
{
    public Guid Id { get; set; }
    public Guid WarrantyTicketId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// DTO phản hồi kết quả kiểm tra thời hạn bảo hành của thiết bị qua số IMEI.
/// </summary>
public class WarrantyCheckResultDto
{
    public bool IsUnderWarranty { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpirationDate { get; set; }
    public Guid? ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public Guid? SalesOrderId { get; set; }
    public string? SalesOrderCode { get; set; }
    public string CurrentImeiStatus { get; set; } = string.Empty;
}
