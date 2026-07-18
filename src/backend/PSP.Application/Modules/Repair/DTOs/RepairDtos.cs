using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Repair.DTOs;

/// <summary>
/// Data Transfer Object (DTO) đại diện cho Phiếu sửa chữa.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Class này dùng để định dạng dữ liệu trả về cho Client thông qua API.
/// - Không trả trực tiếp Entity ra ngoài để bảo mật thông tin và tránh lỗi vòng lặp tham chiếu EF Core.
/// </summary>
public class RepairTicketDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;

    public string? Imei { get; set; }
    public Guid ReceivedById { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;

    public Guid? TechnicianId { get; set; }
    public string? TechnicianName { get; set; }

    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    
    // Tính tổng tiền công sửa chữa + linh kiện thay thế
    public decimal LaborCost { get; set; } // Tiền công thợ sửa (Ví dụ: ActualCost hoặc EstimatedCost)
    public decimal PartsTotal { get; set; } // Tổng tiền linh kiện
    public decimal TotalAmount => LaborCost + PartsTotal; // Tổng chi phí khách phải trả

    public DateTime ReceivedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    
    public List<RepairPartDto> Parts { get; set; } = new();
    public List<RepairStatusHistoryDto> StatusHistories { get; set; } = new();
}

/// <summary>
/// DTO đại diện cho Linh kiện thay thế trong Phiếu sửa chữa.
/// </summary>
public class RepairPartDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
}

/// <summary>
/// DTO đại diện cho Lịch sử chuyển trạng thái sửa chữa.
/// </summary>
public class RepairStatusHistoryDto
{
    public Guid Id { get; set; }
    public Guid RepairTicketId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}
