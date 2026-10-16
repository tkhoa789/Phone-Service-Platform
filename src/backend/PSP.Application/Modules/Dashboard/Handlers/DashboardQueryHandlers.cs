using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Dashboard.DTOs;
using PSP.Application.Modules.Dashboard.Queries;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Dashboard.Handlers;

/// <summary>
/// =====================================================================
/// BỘ XỬ LÝ TRUY VẤN DASHBOARD (DashboardQueryHandlers)
/// =====================================================================
/// 
/// Lớp này xử lý việc tính toán các chỉ số kinh doanh động phục vụ cho Dashboard.
/// Hỗ trợ phân quyền nghiêm ngặt theo BR-1201 (Dashboard theo quyền người dùng):
/// - Quản lý (Manager) chỉ được xem số liệu thuộc chi nhánh của mình.
/// - Quản trị viên (Admin) được xem số liệu toàn hệ thống hoặc lọc theo chi nhánh.
/// 
/// Các nghiệp vụ tính toán:
/// - Doanh thu từ hóa đơn đã trả tiền (Paid) (BR-1202).
/// - Lợi nhuận = doanh thu - giá vốn (BR-1203).
/// - Hàng tồn chậm bán (Dead Stock) = hàng tồn kho > 0 và chưa bán được >= 30 ngày.
/// 
/// Viết comment cực kỳ chi tiết cho lập trình viên dưới cấp độ junior dễ dàng học hỏi.
/// =====================================================================
/// </summary>
public class DashboardQueryHandlers : IRequestHandler<GetManagerDashboardQuery, ManagerDashboardDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;
    private readonly IFieldVisibilityService _fieldVisibility;

    public DashboardQueryHandlers(
        IUnitOfWork unitOfWork, 
        ICurrentUserService currentUserService,
        IScopeContextService scopeContext,
        IFieldVisibilityService? fieldVisibility = null)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext;
        _fieldVisibility = fieldVisibility ?? new PSP.Application.Common.Security.FieldVisibilityService(currentUserService);
    }

    public async Task<ManagerDashboardDto> Handle(GetManagerDashboardQuery request, CancellationToken cancellationToken)
    {
        // 1. Xác định thông tin người dùng đang gọi API
        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr))
        {
            throw new UnauthorizedAccessException("Không xác định được danh tính người dùng hiện tại.");
        }
        var userId = Guid.Parse(userIdStr);

        // 2. Kiểm tra vai trò của người dùng trong hệ thống
        var userRoles = _unitOfWork.Repository<UserEntity>().GetQueryableAsNoTracking()
            .Where(u => u.Id == userId)
            .SelectMany(u => u.UserRoles)
            .Select(ur => ur.Role.Name)
            .ToList();

        var isOwner = userRoles.Contains("Owner");
        var isAdmin = userRoles.Contains("Admin") || isOwner;
        var isManager = userRoles.Contains("Manager");
        var isSales = userRoles.Contains("Sales");
        var isTech = userRoles.Contains("Technician");
        var isWarranty = userRoles.Contains("Warranty");
        var isInventory = userRoles.Contains("Inventory");

        if (!isOwner && !isAdmin && !isManager && !isSales && !isTech && !isWarranty && !isInventory)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập vào số liệu Dashboard này.");
        }

        // 3. Phân quyền hiển thị dữ liệu (BR-1201 / RBAC-03 Scope)
        Guid? filterBranchId = _scopeContext.GetEffectiveBranchFilter(request.BranchId);

        // 4. Khởi tạo truy vấn gốc cho Hóa đơn (Invoices) để tính Doanh thu và Lợi nhuận
        // BR-1202: Doanh thu được tính từ các hóa đơn đã thanh toán thành công (Paid)
        var invoiceQuery = _unitOfWork.Repository<InvoiceEntity>().GetQueryableAsNoTracking()
            .Where(i => i.Status == InvoiceStatus.Paid);

        var invoiceItemQuery = _unitOfWork.Repository<InvoiceItemEntity>().GetQueryableAsNoTracking()
            .Where(ii => ii.Invoice != null && ii.Invoice.Status == InvoiceStatus.Paid && ii.ProductVariant != null);

        // Áp dụng bộ lọc chi nhánh nếu có
        if (filterBranchId.HasValue)
        {
            invoiceQuery = invoiceQuery.Where(i => i.SalesOrder != null && i.SalesOrder.BranchId == filterBranchId.Value);
            invoiceItemQuery = invoiceItemQuery.Where(ii => ii.Invoice != null && ii.Invoice.SalesOrder != null && ii.Invoice.SalesOrder.BranchId == filterBranchId.Value);
        }

        // --- Chỉ số 1: Tổng Doanh thu ---
        var totalRevenue = invoiceQuery.Any() ? invoiceQuery.Sum(i => i.Amount) : 0m;

        // --- Chỉ số 2: Tổng Lợi nhuận (BR-1203) ---
        // Lợi nhuận = (Đơn giá bán thực tế - Giá vốn nhập hàng) * Số lượng bán
        var totalProfit = invoiceItemQuery.Any() 
            ? invoiceItemQuery.Sum(ii => (ii.UnitPrice - ii.ProductVariant.CostPrice) * ii.Quantity) 
            : 0m;

        // --- Chỉ số 3: Tổng số lượng máy bán ra ---
        var unitsSold = invoiceItemQuery.Any() ? invoiceItemQuery.Sum(ii => ii.Quantity) : 0;

        // --- Chỉ số 4: Số phiếu sửa chữa đang xử lý (Open Repairs) ---
        // Lọc các phiếu sửa chữa chưa hoàn thành (Completed), chưa hủy (Cancelled) và loại trừ dữ liệu test
        var repairQuery = _unitOfWork.Repository<RepairTicketEntity>().GetQueryableAsNoTracking()
            .Where(r => !r.IsTest && r.Status != RepairTicketStatus.Completed && r.Status != RepairTicketStatus.Cancelled);

        if (filterBranchId.HasValue)
        {
            repairQuery = repairQuery.Where(r => r.BranchId == filterBranchId.Value);
        }
        var openRepairs = repairQuery.Count();

        // --- Chỉ số 5: Số phiếu bảo hành đang xử lý (Open Warranties) ---
        // Lọc các phiếu bảo hành chưa hoàn thành (Completed), chưa hủy (Cancelled), chưa từ chối (Rejected)
        var warrantyQuery = _unitOfWork.Repository<WarrantyTicketEntity>().GetQueryableAsNoTracking()
            .Where(w => w.Status != WarrantyTicketStatus.Completed && 
                        w.Status != WarrantyTicketStatus.Rejected && 
                        w.Status != WarrantyTicketStatus.Cancelled);

        if (filterBranchId.HasValue)
        {
            warrantyQuery = warrantyQuery.Where(w => w.SalesOrder != null && w.SalesOrder.BranchId == filterBranchId.Value);
        }
        var openWarranties = warrantyQuery.Count();

        // --- Chỉ số 6: Doanh thu theo chi nhánh ---
        var branchRevenueList = new List<BranchRevenueDto>();
        if (filterBranchId.HasValue)
        {
            // Nếu lọc cụ thể 1 chi nhánh, chỉ lấy thông tin của chi nhánh đó
            var branch = await _unitOfWork.Repository<BranchEntity>().GetByIdAsNoTrackingAsync(filterBranchId.Value, cancellationToken);
            branchRevenueList.Add(new BranchRevenueDto
            {
                BranchId = filterBranchId.Value,
                BranchName = branch?.Name ?? "Chi nhánh không tồn tại",
                Revenue = totalRevenue
            });
        }
        else
        {
            // Nếu xem toàn cục (Admin/Owner), gom nhóm doanh thu theo từng chi nhánh
            // Join với BranchEntity để lấy tên chi nhánh (vì InvoiceEntity chứa BranchId)
            var branchRevenues = _unitOfWork.Repository<InvoiceEntity>().GetQueryableAsNoTracking()
                .Where(i => i.Status == InvoiceStatus.Paid && i.BranchId != null && i.Branch != null)
                .GroupBy(i => new { i.BranchId, i.Branch!.Name })
                .Select(g => new BranchRevenueDto
                {
                    BranchId = g.Key.BranchId.Value,
                    BranchName = g.Key.Name,
                    Revenue = g.Sum(i => i.Amount)
                })
                .ToList();
            branchRevenueList.AddRange(branchRevenues);
        }

        // --- Chỉ số 7: Biểu đồ doanh thu 30 ngày qua ---
        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-29);
        var rawInvoices = invoiceQuery
            .Where(i => i.CreatedAt >= thirtyDaysAgo)
            .Select(i => new { i.CreatedAt, i.Amount })
            .ToList();

        var dailyRevenuesDb = rawInvoices
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(i => i.Amount)
            })
            .ToList();

        var thirtyDaysRevenueList = new List<DailyRevenueDto>();
        for (int i = 0; i < 30; i++)
        {
            var date = thirtyDaysAgo.AddDays(i);
            var dbRecord = dailyRevenuesDb.FirstOrDefault(d => d.Date == date);
            thirtyDaysRevenueList.Add(new DailyRevenueDto
            {
                Date = date,
                Revenue = dbRecord?.Revenue ?? 0m
            });
        }

        // --- Chỉ số 8: Top 5 sản phẩm bán chạy nhất ---
        var topProducts = invoiceItemQuery
            .Where(ii => ii.ProductVariant != null)
            .GroupBy(ii => new { ii.ProductVariantId, ii.ProductVariant.Name, ii.ProductVariant.Sku })
            .Select(g => new TopProductDto
            {
                ProductVariantId = g.Key.ProductVariantId,
                ProductName = g.Key.Name,
                Sku = g.Key.Sku,
                QuantitySold = g.Sum(ii => ii.Quantity),
                Revenue = g.Sum(ii => ii.Quantity * ii.UnitPrice)
            })
            .OrderByDescending(tp => tp.QuantitySold)
            .Take(5)
            .ToList();

        // --- Chỉ số 9: Hàng tồn kho đọng vốn (Dead Stock - Chậm bán) ---
        // Lấy tất cả hàng hóa hiện đang có số lượng > 0 trong các kho
        var inventoryQuery = _unitOfWork.Repository<InventoryEntity>().GetQueryableAsNoTracking()
            .Where(inv => inv.Quantity > 0 && inv.ProductVariant != null && inv.Warehouse != null);

        if (filterBranchId.HasValue)
        {
            inventoryQuery = inventoryQuery.Where(inv => inv.Warehouse.BranchId == filterBranchId.Value);
        }

        var inventories = inventoryQuery
            .Select(inv => new
            {
                inv.ProductVariantId,
                VariantName = inv.ProductVariant.Name,
                inv.ProductVariant.Sku,
                inv.Quantity,
                WarehouseName = inv.Warehouse.Name,
                inv.Warehouse.BranchId
            })
            .ToList();

        // Tìm thời gian giao dịch gần nhất cho từng dòng biến thể sản phẩm
        var productVariantIds = inventories.Select(i => i.ProductVariantId).Distinct().ToList();
        var lastSales = _unitOfWork.Repository<InvoiceItemEntity>().GetQueryableAsNoTracking()
            .Where(ii => ii.Invoice.Status == InvoiceStatus.Paid && productVariantIds.Contains(ii.ProductVariantId))
            .GroupBy(ii => ii.ProductVariantId)
            .Select(g => new
            {
                ProductVariantId = g.Key,
                LastSoldDate = g.Max(ii => ii.Invoice.CreatedAt)
            })
            .ToList();

        var deadStockList = new List<DeadStockDto>();
        var now = DateTime.UtcNow;

        foreach (var inv in inventories)
        {
            var lastSale = lastSales.FirstOrDefault(ls => ls.ProductVariantId == inv.ProductVariantId);
            DateTime? lastSoldDate = lastSale?.LastSoldDate;
            
            int daysSinceLastSale;
            if (lastSoldDate.HasValue)
            {
                daysSinceLastSale = (now - lastSoldDate.Value).Days;
            }
            else
            {
                // Nếu chưa bao giờ bán được, thiết lập số ngày lớn mặc định
                daysSinceLastSale = 999;
            }

            // Hàng tồn đọng là hàng chưa bán được trong vòng 30 ngày trở lên
            if (daysSinceLastSale >= 30)
            {
                deadStockList.Add(new DeadStockDto
                {
                    ProductVariantId = inv.ProductVariantId,
                    ProductName = inv.VariantName,
                    Sku = inv.Sku,
                    Quantity = inv.Quantity,
                    LastSoldDate = lastSoldDate,
                    WarehouseName = inv.WarehouseName,
                    DaysSinceLastSale = daysSinceLastSale
                });
            }
        }

        // Sắp xếp theo số ngày chậm bán giảm dần (đọng lâu nhất lên đầu), tiếp theo là số lượng hàng tồn đọng nhiều nhất
        var resultDeadStock = deadStockList
            .OrderByDescending(d => d.DaysSinceLastSale)
            .ThenByDescending(d => d.Quantity)
            .Take(10)
            .ToList();

        // 5. Tổng hợp dữ liệu thành DTO hoàn chỉnh
        var dto = new ManagerDashboardDto
        {
            TotalRevenue = totalRevenue,
            TotalProfit = totalProfit,
            UnitsSold = unitsSold,
            OpenRepairs = openRepairs,
            OpenWarranties = openWarranties,
            BranchRevenue = branchRevenueList,
            ThirtyDaysRevenue = thirtyDaysRevenueList,
            TopProducts = topProducts,
            DeadStock = resultDeadStock
        };

        _fieldVisibility.MaskDashboard(dto);
        return dto;
    }
}
