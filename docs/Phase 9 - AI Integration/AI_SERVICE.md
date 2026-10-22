# AI SERVICE CONFIGURATION & CONTRACTS

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Chuẩn hóa theo ASP.NET Core 10 & Microsoft Semantic Kernel)
**Phase:** 9 - AI Integration

---

## 1. Cấu hình Dịch vụ AI (Service Registration)

Tại `src/backend/PSP.Infrastructure/DependencyInjection.cs`, Semantic Kernel và Ollama Client được đăng ký vào DI Container:

```csharp
// Đăng ký Semantic Kernel với Ollama Chat Completion Connector
builder.Services.AddTransient<Kernel>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var endpoint = new Uri(config["Ollama:Endpoint"] ?? "http://localhost:11434");
    var modelId = config["Ollama:ModelId"] ?? "krith/qwen2.5-14b-instruct:IQ3_XXS";

    var kernelBuilder = Kernel.CreateBuilder();
    kernelBuilder.AddOllamaChatCompletion(modelId, endpoint);

    // Đăng ký Native Plugins (Kho hàng, Bán hàng, Bảo hành, Sửa chữa)
    kernelBuilder.Plugins.AddFromType<InventoryPlugin>("Inventory", sp);
    kernelBuilder.Plugins.AddFromType<SalesPlugin>("Sales", sp);
    kernelBuilder.Plugins.AddFromType<WarrantyPlugin>("Warranty", sp);
    kernelBuilder.Plugins.AddFromType<RepairPlugin>("Repair", sp);

    return kernelBuilder.Build();
});

// Đăng ký StoreAssistant Service
builder.Services.AddScoped<IStoreAssistant, StoreAssistant>();
```

---

## 2. Đặc Tả Giao Diện IStoreAssistant

Giao diện cầu nối giữa tầng Application và hệ thống AI:

```csharp
public interface IStoreAssistant
{
    // Đồng bộ: Trả lời toàn bộ câu phản hồi kèm thẻ tác nghiệp (Action Cards)
    Task<AIChatResponseDto> ChatAsync(
        AIChatRequestDto request, 
        UserContext userContext, 
        CancellationToken cancellationToken = default);

    // Bất đồng bộ: Stream chuỗi token theo thời gian thực (Server-Sent Events)
    IAsyncEnumerable<string> StreamChatAsync(
        AIChatRequestDto request, 
        UserContext userContext, 
        CancellationToken cancellationToken = default);
}
```

---

## 3. Hợp đồng API Cung cấp cho Frontend (Endpoints)

### 3.1 Gửi Tin Nhắn Hỏi Đáp: `POST /api/ai/chat`
* **Mô tả:** Endpoint chính để Frontend gửi câu hỏi và nhận câu trả lời cùng các hành động gợi ý (Action Cards).
* **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "conversationId": "4a2b9f6e-1d3c-4e5f-8a9b-0c1d2e3f4a5b",
    "message": "Kiểm tra tồn kho iPhone 15 Pro Max tại chi nhánh Quận 1"
  }
  ```
* **Response Body:**
  ```json
  {
    "success": true,
    "code": "SUCCESS",
    "message": "Thao tác thành công",
    "data": {
      "response": "Tại chi nhánh Quận 1 hiện đang còn 5 chiếc iPhone 15 Pro Max (Mã: IPH15-PM-256). Tất cả đều đang ở trạng thái sẵn sàng bán (InStock).",
      "actionCards": [
        {
          "type": "NAVIGATE_POS",
          "title": "Mở Quầy POS Bán Ngay",
          "payload": { "sku": "IPH15-PM-256", "branchId": "b1" }
        }
      ],
      "toolsUsed": ["Inventory.SearchInventoryAsync"]
    },
    "correlationId": "f7d2e8a1-b4c3-4d2e-9f0a-1b2c3d4e5f6a",
    "timestamp": "2026-10-22T15:00:00Z"
  }
  ```

### 3.2 Stream Tin Nhắn Thời Gian Thực: `POST /api/ai/chat-stream`
* **Mô tả:** Stream từng token phản hồi trực tiếp (`text/event-stream`) mang lại trải nghiệm mượt mà cho người dùng.
