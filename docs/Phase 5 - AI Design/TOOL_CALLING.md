# TOOL CALLING DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 5 - AI Design

---

## 1. Khái niệm Tool Calling
Tool Calling (hay Function Calling) cho phép mô hình ngôn ngữ lớn (LLM) tương tác với môi trường bên ngoài (Database, API, Hệ thống nội bộ) thay vì chỉ sinh ra văn bản thuần túy. 
Microsoft Semantic Kernel xử lý việc này thông qua attribute `[KernelFunction]` và `[Description]`.

## 2. Danh sách các Tools cốt lõi (Core Tools)

Dựa trên nghiệp vụ và cơ sở dữ liệu đã thiết kế, các Tools sau sẽ được cấp cho AI Assistant:

### 2.1 Nhóm Tool: Quản lý Kho (Inventory)
* `check_product_inventory(String sku)`: Kiểm tra tồn kho của một sản phẩm trên toàn hệ thống. Trả về chi tiết tồn kho từng chi nhánh.
* `check_inventory_by_branch(String sku, UUID branchId)`: Kiểm tra tồn kho của một sản phẩm tại một chi nhánh cụ thể.

### 2.2 Nhóm Tool: Bán hàng & Khách hàng (Sales & CRM)
* `search_customer(String phoneOrName)`: Tìm kiếm thông tin khách hàng dựa trên số điện thoại hoặc tên. Trả về UUID, tên, lịch sử mua hàng ngắn.
* `get_order_status(UUID orderId)`: Tra cứu trạng thái đơn hàng (Đang xử lý, Đã thanh toán, Huỷ...).
* `get_product_price_and_promotions(String sku)`: Lấy thông tin giá bán và các chương trình khuyến mãi đang áp dụng cho một SKU.

### 2.3 Nhóm Tool: Bảo hành & Kỹ thuật (Warranty & Repair)
* `get_warranty_status_by_imei(String imei)`: Kiểm tra một máy (theo IMEI/Serial) còn hạn bảo hành hay không, chính sách áp dụng là gì.
* `check_repair_ticket_status(String ticketCode)`: Tra cứu tiến độ của một phiếu sửa chữa đang thực hiện.

## 3. Thiết kế & Triển khai Plugin trong ASP.NET Core (.NET 10)

Mỗi Tool phải được mô tả cực kỳ chi tiết bằng Annotation, vì mô tả này sẽ được Semantic Kernel chuyển thành Tool Definition Schema gửi cho LLM. LLM dựa vào đoạn mô tả tiếng tự nhiên này để quyết định lúc nào nên gọi Tool.

### 3.1 Cấu trúc Java (Ví dụ)

```csharp
// PSP.Infrastructure.Services.AI.Plugins.InventoryPlugin
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
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var items = await dbContext.Inventories
            .AsNoTracking()
            .Include(i => i.ProductVariant).ThenInclude(v => v.Product)
            .Include(i => i.Warehouse).ThenInclude(w => w.Branch)
            .Where(i => i.ProductVariant.Sku.Contains(searchTerm) || i.ProductVariant.Product.Name.Contains(searchTerm))
            .Select(i => new {
                Branch = i.Warehouse.Branch.Name,
                Sku = i.ProductVariant.Sku,
                ProductName = i.ProductVariant.Product.Name,
                Quantity = i.Quantity,
                Price = i.ProductVariant.Price
            })
            .Take(10)
            .ToListAsync(cancellationToken);

        if (!items.Any()) return "Không tìm thấy dữ liệu tồn kho phù hợp.";
        return JsonSerializer.Serialize(items);
    }
}
```

## 4. Nguyên tắc thiết kế Tool (Tool Design Principles)
1. **Mô tả rõ ràng:** Nội dung bên trong annotation `@Tool` và `@P` (Parameter) phải viết bằng tiếng Việt rõ ràng, nói rõ công dụng và định dạng dữ liệu đầu vào mong muốn.
2. **Xử lý lỗi (Error Handling):** Tool KHÔNG ĐƯỢC ném (throw) Exception (VD: NullPointerException, NotFoundException) lên cấp cao làm sập tiến trình hội thoại. Thay vào đó, nếu lỗi, Tool phải `return` một chuỗi văn bản thông báo lỗi cụ thể để AI biết cách xin lỗi và báo lại người dùng (Ví dụ: `return "Lỗi: Không tìm thấy khách hàng nào với số điện thoại này"`;)
3. **Phân quyền (Authorization):** Nếu Tool thực hiện hành động truy xuất dữ liệu nhạy cảm, phải kiểm tra context của người dùng hiện tại (lấy từ SecurityContextHolder của ASP.NET Core RBAC & AISecurityContextHolder) xem nhân viên đó có quyền gọi hành động này không. Nếu không, `return "Lỗi: Nhân viên không có quyền truy cập dữ liệu này"`.
4. **Giới hạn Output:** LLM có giới hạn Context Window. Tool chỉ trả về JSON với các trường (fields) cần thiết nhất, không nên query `SELECT *` rồi parse chuỗi JSON khổng lồ trả lại cho LLM.
