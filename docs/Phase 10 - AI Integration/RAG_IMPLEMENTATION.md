# RAG IMPLEMENTATION

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 10 - AI Integration

---

## 1. Triển khai Kỹ thuật RAG với Qdrant

### 1.1 Khởi tạo Embedding Store (Qdrant Client)

```java
@Bean
public EmbeddingStore<TextSegment> qdrantEmbeddingStore() {
    return QdrantEmbeddingStore.builder()
            .host("localhost")
            .port(6334) // Port gRPC của Qdrant
            .collectionName("knowledge_base")
            .build();
}
```

### 1.2 Pipeline Tải Dữ liệu (Document Ingestion)

Viết một batch job để đọc các file Markdown/PDF từ thư mục `docs/` và nạp vào Qdrant.

```java
public void ingestDocuments() {
    Document document = FileSystemDocumentLoader.loadDocument(Paths.get("docs/chinh_sach_bao_hanh.md"));
    
    // Chia nhỏ văn bản, mỗi đoạn tối đa 500 tokens, lặp lại 50 tokens
    DocumentSplitter splitter = DocumentSplitters.recursive(500, 50);
    List<TextSegment> segments = splitter.split(document);
    
    // Gán metadata
    segments.forEach(segment -> segment.metadata().put("category", "warranty"));

    // Nhúng và lưu vào Qdrant
    List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
    qdrantEmbeddingStore.addAll(embeddings, segments);
}
```

## 2. Tối ưu Truy xuất (Advanced Retrieval)

Để khắc phục điểm yếu của RAG cơ bản, hệ thống cấu hình `EmbeddingStoreContentRetriever` kết hợp Filter.

```java
@Bean
public ContentRetriever contentRetriever(EmbeddingStore<TextSegment> store, EmbeddingModel model) {
    return EmbeddingStoreContentRetriever.builder()
            .embeddingStore(store)
            .embeddingModel(model)
            .maxResults(3)           // Chỉ lấy 3 đoạn liên quan nhất để tiết kiệm token
            .minScore(0.75)          // Bỏ qua các đoạn không liên quan
            .build();
}
```
*Lưu ý:* Cấu hình `minScore` rất quan trọng. Nếu đặt quá thấp, AI sẽ nhận được Context không liên quan, dẫn đến ảo giác (Hallucination).
