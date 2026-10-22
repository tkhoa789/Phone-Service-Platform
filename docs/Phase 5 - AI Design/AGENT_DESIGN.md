# AGENT DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 5 - AI Design

---

## 1. Khái niệm Agent trong hệ thống
Hệ thống sử dụng mô hình **ReAct (Reasoning and Acting) Agent** thông qua sự hỗ trợ của LLM (Ollama/Qwen) và Microsoft Semantic Kernel. Agent không chỉ đơn thuần là bộ máy trả lời câu hỏi, mà nó có khả năng:
1. **Suy luận (Reasoning):** Phân tích câu hỏi của nhân viên để xác định mục đích (Intent).
2. **Hành động (Acting):** Quyết định gọi công cụ (Tool) nào, với tham số gì.
3. **Quan sát (Observation):** Phân tích kết quả trả về từ công cụ để tổng hợp câu trả lời cuối cùng.

## 2. Kiến trúc Agent

### 2.1 Cấu trúc AIService của Microsoft Semantic Kernel
Agent được thiết kế ẩn dưới dạng các Interface trong ASP.NET Core 10 Native Plugins (`[KernelFunction]`).

```csharp
// PSP.Application.Common.Interfaces.IStoreAssistant
public interface IStoreAssistant
{
    Task<AIChatResponseDto> ChatAsync(
        AIChatRequestDto request,
        UserContext userContext,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<string> StreamChatAsync(
        AIChatRequestDto request,
        UserContext userContext,
        CancellationToken cancellationToken = default);
}
```

### 2.2 Các Khối chức năng của Agent
* **LLM Engine:** Mô hình ngôn ngữ chịu trách nhiệm suy luận (OllamaChatModel).
* **Chat Memory:** Lưu trữ bộ nhớ hội thoại để Agent hiểu ngữ cảnh nhiều lượt (Multi-turn context).
* **Tools (Công cụ):** Các phương thức Java (được gắn `@Tool`) cho phép Agent truy cập vào SQL Server 2022.
* **Content Retriever (RAG):** Cung cấp các tài liệu tri thức (văn bản) từ Qdrant cho Agent.

## 3. Quy trình làm việc của Agent (Agent Workflow)

### Ví dụ Kịch bản: Nhân viên hỏi "Khách hàng Nguyễn Văn A có máy nào đang bảo hành không?"

1. **User Input:** Nhân viên nhập truy vấn.
2. **Reasoning (Lần 1):** Agent phân tích: "Cần tìm số điện thoại của Nguyễn Văn A, sau đó tra cứu bảo hành".
3. **Acting (Lần 1):** Agent quyết định gọi Tool: `searchCustomerByName(name="Nguyễn Văn A")`.
4. **Observation (Lần 1):** C# Semantic Kernel Plugin thực thi Tool, trả về JSON `[{"id":"...", "phone":"0901234567"}]`.
5. **Reasoning (Lần 2):** Agent phân tích: "Đã có số điện thoại, bây giờ tra cứu bảo hành".
6. **Acting (Lần 2):** Agent quyết định gọi Tool: `getWarrantyByCustomer(phone="0901234567")`.
7. **Observation (Lần 2):** Plugin trả về JSON chi tiết phiếu bảo hành.
8. **Final Response:** Agent tổng hợp dữ liệu thành văn bản tiếng Việt tự nhiên và gửi về cho nhân viên.

## 4. Quản lý Vòng lặp Agent (Agent Execution Loop)
Trong Microsoft Semantic Kernel, quá trình gọi nhiều Tool liên tiếp được quản lý tự động. Tuy nhiên, để ngăn chặn vòng lặp vô hạn (Infinite Loop) do AI bị "ảo giác" hoặc lỗi logic, chúng ta cấu hình giới hạn số bước thực thi tối đa:

```java
@Configuration
public class AgentConfig {
    @Bean
    public StoreAgent storeAgent(ChatLanguageModel chatLanguageModel, 
                                 ChatMemoryProvider chatMemoryProvider, 
                                 ContentRetriever contentRetriever,
                                 List<Object> tools) {
        return AiServices.builder(StoreAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider)
                .contentRetriever(contentRetriever)
                .tools(tools) // Cấp phát công cụ
                .build();
    }
}
```
*Lưu ý cấu hình LLM properties:* Cần đảm bảo mô hình LLM hỗ trợ Function Calling (như Qwen-Agent hoặc Qwen2.5) và thông số `max-retries` / `max-execution-steps` được thiết lập giới hạn (thường là 3-5 bước).
