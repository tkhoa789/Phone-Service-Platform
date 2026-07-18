# MEMORY DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 5 - AI Design

---

## 1. Khái quát Chat Memory
Vì LLM bản chất là phi trạng thái (stateless - không nhớ ngữ cảnh các câu hỏi trước), hệ thống cần một cơ chế lưu trữ và tiêm (inject) lịch sử trò chuyện vào mỗi câu hỏi (prompt) để tạo cảm giác AI có "trí nhớ".

Trong LangChain4j, khái niệm này gọi là **ChatMemory**.

## 2. Loại Memory (Memory Type)

Hệ thống sử dụng **TokenWindowChatMemory**.
* **Lý do:** Khác với `MessageWindowChatMemory` (chỉ lưu đúng N tin nhắn gần nhất), `TokenWindowChatMemory` tính toán số lượng token chính xác của các tin nhắn. Điều này đảm bảo Prompt được gửi cho LLM không bao giờ vượt qua Context Window Limit (ví dụ: giới hạn 8000 tokens của Qwen) dẫn đến lỗi hệ thống hoặc mất hoàn toàn chi tiết dài.
* **Cấu hình:** Giới hạn khoảng 2000 - 3000 tokens cho bộ nhớ để chừa khoảng trống (headroom) cho System Prompt, Context từ RAG và Tool responses.

## 3. Lưu trữ Bộ nhớ (Memory Persistence)

Bộ nhớ hội thoại trong quá trình chạy (Runtime) sẽ được LangChain4j duy trì trong RAM, nhưng cần phải lưu trữ lâu dài xuống Database để:
1. Nhân viên có thể xem lại lịch sử chat ngày hôm qua, tuần trước.
2. Ứng dụng khởi động lại không bị mất ngữ cảnh của phiên chat đang dang dở.

### 3.1 Giao diện ChatMemoryStore
Thực thi interface `ChatMemoryStore` của LangChain4j, ghi nhận xuống PostgreSQL (bảng `ai_messages` và `ai_conversations` ở Phase 2).

```java
@Component
public class PostgresChatMemoryStore implements ChatMemoryStore {

    private final AiMessageRepository messageRepository;

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        // Query database bảng ai_messages theo conversationId (memoryId)
        // Parse JSON content trả về List<ChatMessage> (SystemMessage, UserMessage, AiMessage, ToolExecutionResultMessage)
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        // Cập nhật hoặc chèn các tin nhắn mới vào database
        // Cần tuần tự hóa (Serialize) ChatMessage thành JSON
    }

    @Override
    public void deleteMessages(Object memoryId) {
        // Soft delete hoặc hard delete tuỳ policy
    }
}
```

### 3.2 Phân tách Hội thoại (Conversation Segregation)
* Mỗi phiên chat được định danh bằng một `Conversation ID` (UUID).
* `memoryId` trong kiến trúc LangChain4j chính là `Conversation ID`.
* Khi Frontend mở một Tab chat mới, Backend tạo một `Conversation ID` mới. AI sẽ không bị nhầm lẫn giữa các luồng công việc khác nhau của nhân viên.
* **Bảo mật:** Backend phải luôn kiểm tra `Conversation ID` thuộc sở hữu của User ID đang request (thông qua JWT token) trước khi cho phép truy xuất/cập nhật `ChatMemory`.

## 4. Quản lý Tool Execution Messages
Một phần rất quan trọng của `ChatMemory` trong kiến trúc Agent là lưu lại các bước AI gọi Tool (`ToolExecutionRequestMessage`) và hệ thống trả về kết quả (`ToolExecutionResultMessage`).
Những tin nhắn này KHÔNG NÊN hiển thị trực tiếp lên UI cho End-User (vì định dạng JSON xấu và kỹ thuật), nhưng PHẢI được lưu trong `ChatMemory` để LLM hiểu luồng suy luận của chính nó.
Frontend sẽ tự động filter bỏ các message type này, chỉ hiển thị `AiMessage` và `UserMessage`.
