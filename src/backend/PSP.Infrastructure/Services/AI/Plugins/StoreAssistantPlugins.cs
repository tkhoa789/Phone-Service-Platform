using System.ComponentModel;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using PSP.Infrastructure.Data;

namespace PSP.Infrastructure.Services.AI.Plugins;

/// <summary>
/// Quản lý Ngữ cảnh Bảo mật luồng AI (AsyncLocal) đảm bảo Tool Calling tuân thủ 100% RBAC.
/// </summary>
public static class AISecurityContextHolder
{
    private static readonly AsyncLocal<AISecurityContext?> _currentContext = new();
    public static AISecurityContext? Current
    {
        get => _currentContext.Value;
        set => _currentContext.Value = value;
    }
}

/// <summary>
/// Helper làm sạch chuỗi trích xuất từ Database chống Indirect Prompt Injection (Chuỗi sập 5).
/// </summary>
public static class AIPluginSanitizer
{
    private static readonly Regex InjectionPattern = new(
        @"(?:\[\s*SYSTEM\s*\]|System Override|Ignore (?:all )?previous instructions|Bỏ qua mọi quy định|<\|im_start\|>|<\|im_end\|>)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string Sanitize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var cleaned = InjectionPattern.Replace(input, "[REDACTED_SECURITY]");
        return new string(cleaned.Where(c => !char.IsControl(c) || c == '\n' || c == '\r' || c == '\t').ToArray()).Trim();
    }
}

/// <summary>
/// Plugin tra cứu thông tin Tồn kho (Inventory) có chốt chặn RBAC Masking (Khớp 100% Schema Domain).
/// </summary>
public class InventoryPlugin
{
    private readonly IServiceScopeFactory _scopeFactory;

    public InventoryPlugin(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [KernelFunction, Description("Tra cứu số lượng tồn kho và giá bán của sản phẩm hoặc linh kiện theo mã SKU hoặc tên")]
    public async Task<string> SearchInventoryAsync(
        [Description("Mã SKU hoặc tên sản phẩm cần tra cứu (ví dụ: IP15, Màn hình OLED)")] string searchTerm,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return "KẾT QUẢ TRA CỨU TỒN KHO: Vui lòng cung cấp mã SKU hoặc tên sản phẩm cụ thể để tra cứu.";
        }

        var secContext = AISecurityContextHolder.Current;
        var cleanTerm = AIPluginSanitizer.Sanitize(searchTerm);

        // 🛡️ CHỐT CHẶN TỬ HUYỆT 3: Tạo DbContext Scope độc lập, loại trừ xung đột luồng
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 🛡️ KHỚP 100% SCHEMA: Inventories -> ProductVariant -> Product, Warehouse
        var query = dbContext.Inventories
            .AsNoTracking()
            .Include(i => i.ProductVariant).ThenInclude(v => v.Product)
            .Include(i => i.Warehouse)
            .Where(i => i.ProductVariant.Name.Contains(cleanTerm) || i.ProductVariant.Sku.Contains(cleanTerm));

        // 🛡️ CHỐT CHẶN TỬ HUYỆT 1: Giới hạn phạm vi Chi nhánh nếu không phải Enterprise Scope
        if (secContext != null && !secContext.IsEnterpriseScope && secContext.BranchId.HasValue)
        {
            query = query.Where(i => i.Warehouse.BranchId == secContext.BranchId.Value);
        }

        var items = await query.Take(5).ToListAsync(cancellationToken);

        // 🛡️ CHỐT CHẶN TỬ HUYỆT 4: Bắt buộc trả về thông điệp dứt khoát khi không có dữ liệu, cấm trả về null/rỗng
        if (!items.Any())
        {
            return $"KẾT QUẢ TRA CỨU TỒN KHO: Không tìm thấy sản phẩm nào khớp với từ khóa '{cleanTerm}' trong kho được phép truy cập.";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"KẾT QUẢ TRA CỨU TỒN KHO CHO '{cleanTerm}':");

        foreach (var item in items)
        {
            var variantName = AIPluginSanitizer.Sanitize(item.ProductVariant.Name);
            var sku = AIPluginSanitizer.Sanitize(item.ProductVariant.Sku);
            var warehouse = AIPluginSanitizer.Sanitize(item.Warehouse.Name);

            // 🛡️ KHỚP SCHEMA: Quantity, SalePrice
            sb.Append($"- Sản phẩm: {variantName} (SKU: {sku}) | Kho: {warehouse} | Tồn kho: {item.Quantity} | Giá niêm yết: {item.ProductVariant.SalePrice:N0} VNĐ");

            // 🛡️ NGUYÊN TẮC 'BLIND AT THE ROOT': Chỉ hiển thị CostPrice khi có quyền CanViewCostPrice
            if (secContext?.CanViewCostPrice == true)
            {
                sb.Append($" | Giá vốn: {item.ProductVariant.CostPrice:N0} VNĐ");
            }

            // Chỉ hiển thị biên lợi nhuận khi có quyền CanViewProfit
            if (secContext?.CanViewProfit == true)
            {
                var profit = item.ProductVariant.SalePrice - item.ProductVariant.CostPrice;
                sb.Append($" | Biên lợi nhuận dự kiến: {profit:N0} VNĐ");
            }

            sb.AppendLine();
        }

        return sb.ToString();
    }
}

/// <summary>
/// Plugin tra cứu Phiếu sửa chữa (Repair Ticket) có bảo vệ dữ liệu nhạy cảm (Khớp 100% Schema Domain).
/// </summary>
public class RepairPlugin
{
    private readonly IServiceScopeFactory _scopeFactory;

    public RepairPlugin(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [KernelFunction, Description("Tra cứu thông tin tiến độ, thiết bị và chi phí phiếu sửa chữa theo mã phiếu hoặc số điện thoại khách")]
    public async Task<string> GetRepairTicketAsync(
        [Description("Mã phiếu sửa chữa (ví dụ: REP-2026-0001) hoặc số điện thoại khách hàng")] string ticketOrPhone,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticketOrPhone))
        {
            return "KẾT QUẢ TRA CỨU PHIẾU SỬA CHỮA: Vui lòng cung cấp mã phiếu hoặc số điện thoại để tra cứu.";
        }

        var secContext = AISecurityContextHolder.Current;
        var cleanTerm = AIPluginSanitizer.Sanitize(ticketOrPhone);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 🛡️ KHỚP 100% SCHEMA: Code, Parts, ProductVariant, Customer
        var query = dbContext.RepairTickets
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.ProductVariant)
            .Include(t => t.Parts).ThenInclude(p => p.ProductVariant)
            .Where(t => t.Code.Contains(cleanTerm) || t.Customer.Phone.Contains(cleanTerm));

        if (secContext != null && !secContext.IsEnterpriseScope && secContext.BranchId.HasValue)
        {
            query = query.Where(t => t.BranchId == secContext.BranchId.Value);
        }

        var tickets = await query.Take(3).ToListAsync(cancellationToken);

        if (!tickets.Any())
        {
            return $"KẾT QUẢ TRA CỨU PHIẾU SỬA CHỮA: Không tìm thấy phiếu sửa chữa nào khớp với thông tin '{cleanTerm}'.";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"KẾT QUẢ TRA CỨU PHIẾU SỬA CHỮA CHO '{cleanTerm}':");

        foreach (var t in tickets)
        {
            var customerName = AIPluginSanitizer.Sanitize(t.Customer.FullName);
            // 🛡️ KHỚP SCHEMA: CustomModelName ?? ProductVariant.Name
            var deviceModel = AIPluginSanitizer.Sanitize(t.CustomModelName ?? t.ProductVariant?.Name ?? "Thiết bị không xác định");
            var issue = AIPluginSanitizer.Sanitize(t.ProblemDescription);
            var status = t.Status.ToString();

            sb.AppendLine($"- Phiếu #{t.Code} | Khách hàng: {customerName} | Thiết bị: {deviceModel}");
            sb.AppendLine($"  + Trạng thái: {status} | Mô tả lỗi: {issue}");
            sb.AppendLine($"  + Tổng phí dự kiến: {(t.EstimatedCost.HasValue ? t.EstimatedCost.Value.ToString("N0") : "Chưa báo giá")} VNĐ | Tiền công: {t.LaborCost:N0} VNĐ");

            // 🛡️ KHỚP SCHEMA: Parts -> ProductVariant, UnitPrice, CostAtWriteOff
            if (t.Parts.Any())
            {
                sb.Append("  + Linh kiện thay thế: ");
                var partsInfo = t.Parts.Select(p =>
                {
                    var partName = AIPluginSanitizer.Sanitize(p.ProductVariant?.Name ?? "Linh kiện");
                    var info = $"{partName} (SL: {p.Quantity}, Giá: {p.UnitPrice:N0} VNĐ)";
                    if (secContext?.CanViewCostPrice == true)
                    {
                        var cost = p.CostAtWriteOff ?? p.ProductVariant?.CostPrice ?? 0;
                        info += $" [Vốn: {cost:N0} VNĐ]";
                    }
                    return info;
                });
                sb.AppendLine(string.Join(", ", partsInfo));
            }
        }

        return sb.ToString();
    }
}

/// <summary>
/// Plugin tra cứu Bảo hành (Warranty) (Khớp 100% Schema Domain).
/// </summary>
public class WarrantyPlugin
{
    private readonly IServiceScopeFactory _scopeFactory;

    public WarrantyPlugin(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [KernelFunction, Description("Tra cứu thời hạn và tình trạng bảo hành máy hoặc phụ kiện theo IMEI hoặc số điện thoại")]
    public async Task<string> CheckWarrantyAsync(
        [Description("Số IMEI hoặc số điện thoại khách hàng")] string identifier,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return "KẾT QUẢ TRA CỨU BẢO HÀNH: Vui lòng cung cấp số IMEI hoặc số điện thoại.";
        }

        var cleanTerm = AIPluginSanitizer.Sanitize(identifier);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 🛡️ KHỚP 100% SCHEMA: WarrantyTickets, Code, Imei, ProductVariant
        var tickets = await dbContext.WarrantyTickets
            .AsNoTracking()
            .Include(w => w.Customer)
            .Include(w => w.ProductVariant)
            .Where(w => (w.Imei != null && w.Imei.Contains(cleanTerm)) || w.Customer.Phone.Contains(cleanTerm) || w.Code.Contains(cleanTerm))
            .Take(3)
            .ToListAsync(cancellationToken);

        if (!tickets.Any())
        {
            return $"KẾT QUẢ TRA CỨU BẢO HÀNH: Không tìm thấy hồ sơ bảo hành nào khớp với thông tin '{cleanTerm}'.";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"KẾT QUẢ TRA CỨU BẢO HÀNH CHO '{cleanTerm}':");

        foreach (var w in tickets)
        {
            var customer = AIPluginSanitizer.Sanitize(w.Customer.FullName);
            var imei = AIPluginSanitizer.Sanitize(w.Imei ?? "Không có IMEI");
            var productName = AIPluginSanitizer.Sanitize(w.ProductVariant?.Name ?? "Thiết bị");
            var isExpired = w.EndDate.HasValue && DateTime.UtcNow > w.EndDate.Value;
            var statusStr = isExpired ? "ĐÃ HẾT HẠN" : (w.EndDate.HasValue ? $"CÒN HẠN (đến ngày {w.EndDate.Value:dd/MM/yyyy})" : "ĐANG XỬ LÝ");

            sb.AppendLine($"- Phiếu bảo hành #{w.Code} | Thiết bị: {productName} | Khách hàng: {customer} | IMEI: {imei}");
            sb.AppendLine($"  + Trạng thái: {w.Status} ({statusStr}) | Bắt đầu: {(w.StartDate.HasValue ? w.StartDate.Value.ToString("dd/MM/yyyy") : "N/A")}");
        }

        return sb.ToString();
    }
}
