using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.Dashboard.DTOs;

/// <summary>
/// DTO chứa toàn bộ số liệu thống kê cho màn hình Dashboard của Quản lý (Manager/Admin).
/// Báo cáo này tổng hợp dữ liệu doanh thu, lợi nhuận, sửa chữa, bảo hành, tồn kho và cảnh báo.
/// </summary>
public class ManagerDashboardDto
{
    /// <summary>
    /// Tổng doanh thu từ các hóa đơn đã thanh toán (Paid).
    /// </summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Tổng lợi nhuận (Doanh thu - Giá vốn).
    /// </summary>
    public decimal? TotalProfit { get; set; }

    /// <summary>
    /// Tổng số lượng sản phẩm bán ra.
    /// </summary>
    public int UnitsSold { get; set; }

    /// <summary>
    /// Số lượng phiếu sửa chữa đang xử lý (chưa Hoàn thành/Hủy).
    /// </summary>
    public int OpenRepairs { get; set; }

    /// <summary>
    /// Số lượng phiếu bảo hành đang xử lý (chưa Hoàn thành/Từ chối/Hủy).
    /// </summary>
    public int OpenWarranties { get; set; }

    /// <summary>
    /// Thống kê doanh thu theo từng chi nhánh.
    /// </summary>
    public List<BranchRevenueDto> BranchRevenue { get; set; } = new();

    /// <summary>
    /// Dữ liệu biểu đồ doanh thu 30 ngày gần nhất.
    /// </summary>
    public List<DailyRevenueDto> ThirtyDaysRevenue { get; set; } = new();

    /// <summary>
    /// Top 5 sản phẩm bán chạy nhất.
    /// </summary>
    public List<TopProductDto> TopProducts { get; set; } = new();

    /// <summary>
    /// Danh sách tồn kho chậm bán hoặc đọng vốn (không bán được trong >= 30 ngày).
    /// </summary>
    public List<DeadStockDto> DeadStock { get; set; } = new();
}

/// <summary>
/// Thống kê doanh thu chi tiết theo chi nhánh.
/// </summary>
public class BranchRevenueDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}

/// <summary>
/// Thống kê doanh thu theo từng ngày.
/// </summary>
public class DailyRevenueDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
}

/// <summary>
/// Thống kê sản phẩm bán chạy.
/// </summary>
public class TopProductDto
{
    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}

/// <summary>
/// Thống kê hàng tồn kho chậm bán (Dead Stock).
/// </summary>
public class DeadStockDto
{
    public Guid ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime? LastSoldDate { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int DaysSinceLastSale { get; set; }
}
