# EMBEDDING DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 5 - AI Design

---

## 1. Giới thiệu Embedding
Embedding là quá trình mã hoá văn bản (từ ngữ, câu, đoạn văn) thành một chuỗi các con số (Vector không gian nhiều chiều). Các văn bản có ý nghĩa (ngữ nghĩa) giống nhau sẽ có các vector nằm gần nhau trong không gian.
Hệ thống yêu cầu một mô hình Embedding mạnh mẽ, đặc biệt phải hỗ trợ tốt **Tiếng Việt**.

## 2. Lựa chọn Mô hình Embedding (Embedding Model Selection)

Dựa trên yêu cầu hệ thống hoạt động on-premise hoàn toàn, ta sử dụng các Open-source Embedding Models chạy cục bộ.

**Đề xuất Model chính:** `nomic-embed-text` (qua Ollama Embedding API) (phục vụ đặc thù tiếng Việt).
* **nomic-embed-text (Nomic AI):** Mô hình nhúng ngôn ngữ hiệu năng cao, tối ưu hóa toàn diện cho việc truy vấn RAG tiếng Việt và văn bản nghiệp vụ.
* **Vector Dimension (Số chiều):** `768` (chuẩn hóa theo model nomic-embed-text). Dimension này phải khớp với cấu hình Vector Size của Qdrant ở `VECTOR_DB_DESIGN.md`.

## 3. Triển khai Embedding Model

### 3.1 Chạy Model cục bộ
Trong môi trường Production, không nên gọi Embedding qua internet (như OpenAI) để bảo mật tài liệu nội bộ.
Hệ thống sử dụng Ollama Embedding API để sinh vector 768 chiều đồng bộ với Qdrant Vector Database.

### 3.2 Tích hợp bằng LangChain4j (In-Process Embedding)

Cấu hình Backend ASP.NET Core: Tích hợp HttpClient / OllamaSharp gọi trực tiếp endpoint `POST /api/embeddings` của Ollama.

```java
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgem3.BgeM3EmbeddingModel;

@Configuration
public class EmbeddingConfig {

    @Bean
    public EmbeddingModel embeddingModel() {
        // Tải model trực tiếp trong JVM, không cần deploy service riêng.
        // Model nomic-embed-text yêu cầu ~600MB VRAM/RAM, tốc độ sinh embedding < 20ms/chunk.
        return new BgeM3EmbeddingModel();
    }
}
```

## 4. Quy tắc thiết kế văn bản để tối ưu Embedding
Để Vector tạo ra mang ý nghĩa chính xác nhất, dữ liệu văn bản cần được tiền xử lý (Preprocessing) trước khi nạp:
* **Loại bỏ nhiễu:** Xóa các ký tự đặc biệt, HTML tags thừa, số trang trong PDF.
* **Metadata nhúng:** Có thể gán nhãn thêm các keyword quan trọng vào ngay đầu văn bản để tăng trọng số cho các từ khóa đó. (Vd: "CHÍNH SÁCH BẢO HÀNH IPHONE: ...")
* **Chunking hợp lý:** Không Embedding toàn bộ file 100 trang thành 1 vector, cũng không cắt quá vụn. Một đoạn văn (Chunk) nên chứa trọn vẹn một ý (Ví dụ: một đoạn giải thích chính sách 1 đổi 1 trong 30 ngày). (Tham khảo `RAG_DESIGN.md`).
