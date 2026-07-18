# AI SERVICE CONFIGURATION

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 10 - AI Integration

---

## 1. Tích hợp Mô hình (Model Integration)

### 1.1 Cấu hình LangChain4j ChatModel
Sử dụng mô hình Ollama cục bộ.

```java
@Bean
public ChatLanguageModel chatLanguageModel() {
    return OllamaChatModel.builder()
            .baseUrl("http://localhost:11434")
            .modelName("qwen2.5:7b") // Khuyến nghị dùng qwen để gọi tool tiếng Việt tốt
            .temperature(0.1) // Giảm temperature để câu trả lời chính xác, ít sáng tạo
            .maxRetries(3) // Thử gọi lại nếu tool bị lỗi format
            .build();
}
```

### 1.2 Cấu hình AI Service Interface
Interface cầu nối giữa Java và LLM.

```java
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.MemoryId;

@AiService
public interface StoreAssistant {

    @SystemMessage("""
        Bạn là Hệ thống AI quản lý chuỗi cửa hàng điện thoại.
        Luôn trả lời trung thực, dựa trên công cụ và ngữ cảnh được cung cấp.
        Bạn đang giao tiếp với: {{userContext.fullName}} - Vai trò: {{userContext.role}}
    """)
    String chat(@MemoryId String conversationId, 
                @UserMessage String message, 
                @V("userContext") UserContext userContext);
}
```

## 2. API Cung cấp cho Frontend

### POST `/api/v1/ai/chat`
* **Mô tả:** Endpoint chính để Frontend gửi tin nhắn cho AI.
* **Request Body:**
  ```json
  {
    "conversation_id": "uuid-here",
    "message": "Kiểm tra tồn kho iPhone 15 Pro Max tại Quận 1"
  }
  ```
* **Response Body:**
  ```json
  {
    "code": "SUCCESS",
    "data": {
      "response": "Tại chi nhánh Quận 1 hiện đang còn 5 chiếc iPhone 15 Pro Max (Mã: IPH15-PM). Bạn có muốn tạo phiếu xuất kho không?",
      "action_cards": [] 
    }
  }
  ```
