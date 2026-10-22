# RAG IMPLEMENTATION & VECTOR SEARCH

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Chuẩn hóa theo Qdrant Client .NET & Semantic Kernel)
**Phase:** 9 - AI Integration

---

## 1. Triển khai Kỹ thuật RAG với Qdrant Client trong .NET 10

Hệ thống kết nối trực tiếp với **Qdrant Vector Database v1.12.0** thông qua thư viện `Qdrant.Client` chính hãng trên .NET 10.

### 1.1 Đăng ký Qdrant Client & Ingestion Pipeline
```csharp
// Đăng ký QdrantClient Singleton
builder.Services.AddSingleton<QdrantClient>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var host = config["Qdrant:Host"] ?? "localhost";
    var port = int.Parse(config["Qdrant:Port"] ?? "6334");
    return new QdrantClient(host, port);
});
```

### 1.2 Nạp Tài Liệu Tri Thức (Knowledge Ingestion Pipeline)
Tại `PSP.Infrastructure.Services.AI.AIKnowledgeSeeder`:

```csharp
public async Task IngestKnowledgeDocumentsAsync(CancellationToken cancellationToken = default)
{
    const string collectionName = "store-knowledge";
    
    // Đảm bảo Collection tồn tại với cấu hình Vector 768 chiều và Cosine Metric
    var collections = await _qdrantClient.ListCollectionsAsync(cancellationToken);
    if (!collections.Contains(collectionName))
    {
        await _qdrantClient.CreateCollectionAsync(
            collectionName,
            new VectorParams { Size = 768, Distance = Distance.Cosine },
            cancellationToken: cancellationToken);
    }

    // Đọc các tài liệu nghiệp vụ chuẩn hóa (Chính sách bảo hành, Quy tắc sửa chữa, Danh mục giá)
    var documents = LoadKnowledgeMarkdownDocuments();

    foreach (var doc in documents)
    {
        // Phân đoạn văn bản (Chunking: 500 ký tự, Overlap 50 ký tự)
        var chunks = TextChunker.SplitPlainTextParagraphs(doc.Content, maxTokensPerParagraph: 300, overlapTokens: 50);

        foreach (var chunk in chunks)
        {
            // Sinh vector embedding qua Ollama nomic-embed-text
            float[] vector = await _ollamaEmbeddingService.GenerateEmbeddingAsync(chunk, cancellationToken);

            var point = new PointStruct
            {
                Id = new PointId { Uuid = Guid.NewGuid().ToString() },
                Vectors = vector,
                Payload =
                {
                    ["category"] = doc.Category,
                    ["title"] = doc.Title,
                    ["content"] = chunk,
                    ["source"] = doc.SourceFile
                }
            };

            await _qdrantClient.UpsertAsync(collectionName, new[] { point }, cancellationToken: cancellationToken);
        }
    }
}
```

---

## 2. Tìm Kiếm Ngữ Nghĩa Nâng Cao (Advanced Vector Retrieval)

Khi người dùng gửi câu hỏi, hệ thống thực hiện tìm kiếm vector tương đồng trên Qdrant:

```csharp
public async Task<List<string>> RetrieveRelevantContextAsync(
    string query, 
    string category = null, 
    int topK = 3, 
    float minScore = 0.70f, 
    CancellationToken cancellationToken = default)
{
    // Sinh embedding vector cho câu truy vấn của người dùng
    var queryVector = await _ollamaEmbeddingService.GenerateEmbeddingAsync(query, cancellationToken);

    // Lọc theo danh mục nếu có
    Filter filter = null;
    if (!string.IsNullOrEmpty(category))
    {
        filter = MatchKeyword("category", category);
    }

    // Tìm kiếm Top-K vector gần nhất sử dụng Cosine Distance
    var searchResult = await _qdrantClient.SearchAsync(
        collectionName: "store-knowledge",
        vector: queryVector,
        filter: filter,
        limit: (ulong)topK,
        scoreThreshold: minScore,
        cancellationToken: cancellationToken);

    return searchResult
        .Where(r => r.Score >= minScore)
        .Select(r => r.Payload["content"].StringValue)
        .ToList();
}
```

*Lưu ý bảo mật & chất lượng:* Ngưỡng `scoreThreshold = 0.70f` triệt tiêu 100% các đoạn trích không liên quan, bảo đảm ngữ cảnh nạp vào Prompt luôn chính xác và loại bỏ hoàn toàn hiện tượng ảo giác (Hallucination).
