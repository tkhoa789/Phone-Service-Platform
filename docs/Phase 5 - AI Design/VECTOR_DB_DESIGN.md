# VECTOR DATABASE DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 5 - AI Design

---

## 1. Giới thiệu 
Hệ thống sử dụng **Qdrant** làm Vector Database chuyên dụng phục vụ cho tác vụ RAG. Qdrant được chọn nhờ khả năng tìm kiếm vector cực nhanh (HNSW graph) viết bằng Rust, hỗ trợ payload filtering (lọc siêu dữ liệu) và tích hợp hoàn hảo với LangChain4j.

## 2. Kiến trúc Collections trong Qdrant

Dữ liệu tri thức được phân chia thành các "Collection" (tương tự Table trong SQL) để tối ưu hóa hiệu suất tìm kiếm.

### 2.1 Collection: `knowledge_base`
Chứa tất cả các tài liệu, quy trình, chính sách chung của công ty.
* **Vector Size:** Phụ thuộc vào Embedding Model (ví dụ: `1536` nếu dùng model của OpenAI hoặc BAAI/bge-m3, `768` hoặc `1024` nếu dùng model khác). Sẽ chốt ở `EMBEDDING_DESIGN.md`.
* **Distance Metric:** `Cosine` (Cosine Similarity - Phù hợp nhất cho NLP Embeddings).

### 2.2 Payload Structure (Cấu trúc siêu dữ liệu)
Mỗi Vector (tương ứng với một đoạn TextSegment) trong Qdrant sẽ đi kèm một JSON Payload để phục vụ bộ lọc:
```json
{
  "source_file": "chinh_sach_bao_hanh_v2.pdf",
  "category": "warranty", 
  "page_number": 4,
  "last_updated": "2023-10-01"
}
```

## 3. Khởi tạo Qdrant Collection (Qdrant Configuration)

Ví dụ Script khởi tạo Collection qua REST API của Qdrant:
```http
PUT /collections/knowledge_base
{
  "vectors": {
    "size": 1024,
    "distance": "Cosine"
  },
  "optimizers_config": {
    "default_segment_number": 2
  },
  "hnsw_config": {
    "m": 16,
    "ef_construct": 100
  }
}
```
*(Tham số `m` và `ef_construct` cấu hình cho thuật toán HNSW index nhằm cân bằng giữa tốc độ index và độ chính xác lúc search).*

## 4. Lọc Metadata trong LangChain4j (Metadata Filtering)

Khi thực hiện tìm kiếm, chúng ta có thể lợi dụng Payload để thu hẹp phạm vi. LangChain4j hỗ trợ Qdrant Filter:

```java
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;

Filter filter = MetadataFilterBuilder.metadataKey("category").isEqualTo("warranty");

ContentRetriever retriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(qdrantEmbeddingStore)
    .embeddingModel(embeddingModel)
    .filter(filter)
    .build();
```

## 5. Chiến lược Triển khai (Deployment)
* **Môi trường:** Triển khai Qdrant thông qua Docker container trên server on-premise chung mạng nội bộ với Spring Boot và Ollama để giảm thiểu độ trễ mạng (Network Latency).
* **Backup:** Sử dụng cơ chế Snapshot của Qdrant để backup định kỳ Collection `knowledge_base` ra ổ đĩa lưu trữ.
