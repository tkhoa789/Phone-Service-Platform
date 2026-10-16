using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Embeddings;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Services;

/// <summary>
/// DỊCH VỤ TRỢ LÝ CỬA HÀNG (StoreAssistant) - BẢN HOÀN THIỆN TÍCH HỢP AI & RAG (Module 20)
/// 
/// Lớp này xử lý việc kết nối với local Ollama LLM và local Qdrant Vector DB thông qua Semantic Kernel.
/// Đã bổ sung cơ chế Fallback An toàn: Nếu Docker Qdrant chưa được bật, AI vẫn hoạt động trực tiếp qua Ollama bình thường!
/// </summary>
public class StoreAssistant : IStoreAssistant
{
    private readonly Kernel _kernel;
    private readonly QdrantClient _qdrantClient;
    private readonly IConfiguration _configuration;
    private readonly string _collectionName;

    public StoreAssistant(Kernel kernel, QdrantClient qdrantClient, IConfiguration configuration)
    {
        _kernel = kernel;
        _qdrantClient = qdrantClient;
        _configuration = configuration;
        _collectionName = configuration["AiSettings:QdrantCollection"] ?? "psp_knowledge_base";
    }

    /// <summary>
    /// Phân tích dữ liệu tồn kho thấp và tự động sinh ra đề xuất giải pháp xử lý qua local LLM (Ollama).
    /// </summary>
    public async Task<string> AnalyzeInsightAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var systemPrompt = "Bạn là Trợ lý AI phân tích kho vận cho chuỗi cửa hàng điện thoại PSP. Hãy phân tích danh sách sản phẩm tồn kho thấp dưới đây và đề xuất giải pháp điều chuyển kho/nhập hàng tối ưu bằng tiếng Việt.";
        var fullPrompt = $"{systemPrompt}\n\nYêu cầu: {prompt}";
        
        var result = await _kernel.InvokePromptAsync(fullPrompt, cancellationToken: cancellationToken);
        return result.ToString();
    }

    /// <summary>
    /// Gửi hội thoại chat thông thường kèm theo ngữ cảnh RAG và lịch sử.
    /// </summary>
    public async Task<string> ChatAsync(string systemPrompt, string userMessage, List<string> ragContexts, CancellationToken cancellationToken = default)
    {
        var contextText = (ragContexts != null && ragContexts.Any()) 
            ? string.Join("\n\n", ragContexts) 
            : "Không có tài liệu tri thức nào liên quan.";

        var fullPrompt = $@"System Prompt: {systemPrompt}

Ngữ cảnh cửa hàng (RAG Context - Bạn chỉ được dùng thông tin này để trả lời nếu liên quan):
{contextText}

User Message: {userMessage}

Trả lời:";

        var result = await _kernel.InvokePromptAsync(fullPrompt, cancellationToken: cancellationToken);
        return result.ToString();
    }

    /// <summary>
    /// Gửi hội thoại chat và trả về kết quả dạng luồng (Streaming).
    /// </summary>
    public async IAsyncEnumerable<string> ChatStreamAsync(string systemPrompt, string userMessage, List<string> ragContexts, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var contextText = (ragContexts != null && ragContexts.Any()) 
            ? string.Join("\n\n", ragContexts) 
            : "Không có tài liệu tri thức nào liên quan.";

        var fullPrompt = $@"System Prompt: {systemPrompt}

Ngữ cảnh cửa hàng (RAG Context - Bạn chỉ được dùng thông tin này để trả lời nếu liên quan):
{contextText}

User Message: {userMessage}

Trả lời:";

        var stream = _kernel.InvokePromptStreamingAsync(fullPrompt, cancellationToken: cancellationToken);
        await foreach (var chunk in stream)
        {
            if (chunk != null)
            {
                yield return chunk.ToString();
            }
        }
    }

    /// <summary>
    /// Phân đoạn văn bản (Ingest) và đẩy vào cơ sở dữ liệu Vector Qdrant.
    /// </summary>
    public async Task IngestDocumentAsync(string title, string content, string sourceType, CancellationToken cancellationToken = default)
    {
        try
        {
#pragma warning disable SKEXP0070, CS0618
            var embeddingService = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
#pragma warning restore SKEXP0070, CS0618

            var chunks = ChunkText(content, 500, 50);

            var exists = await _qdrantClient.CollectionExistsAsync(_collectionName, cancellationToken);
            if (!exists)
            {
                var testEmbedding = await embeddingService.GenerateEmbeddingAsync("test", cancellationToken: cancellationToken);
                var dimension = (ulong)testEmbedding.Length;

                await _qdrantClient.CreateCollectionAsync(
                    _collectionName, 
                    new VectorParams { Size = dimension, Distance = Distance.Cosine }, 
                    cancellationToken: cancellationToken
                );
            }

            var points = new List<PointStruct>();
            for (int i = 0; i < chunks.Count; i++)
            {
                var chunkText = chunks[i];
                var embedding = await embeddingService.GenerateEmbeddingAsync(chunkText, cancellationToken: cancellationToken);

                var point = new PointStruct
                {
                    Id = Guid.NewGuid(),
                    Vectors = embedding.ToArray(),
                    Payload = 
                    {
                        ["title"] = title,
                        ["content"] = chunkText,
                        ["source_type"] = sourceType,
                        ["chunk_index"] = i
                    }
                };
                points.Add(point);
            }

            if (points.Any())
            {
                await _qdrantClient.UpsertAsync(_collectionName, points, cancellationToken: cancellationToken);
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Không thể nạp tri thức vào Qdrant Vector DB (Cổng 6333). Vui lòng đảm bảo Docker Qdrant đang chạy: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Tìm kiếm tài liệu tương tự từ Qdrant (RAG Search). Có Try-Catch Fallback để không làm sập AI Chat nếu Qdrant offline.
    /// </summary>
    public async Task<List<string>> SearchSimilarDocsAsync(string queryText, int maxResults = 3, CancellationToken cancellationToken = default)
    {
        var results = new List<string>();

        try
        {
            var exists = await _qdrantClient.CollectionExistsAsync(_collectionName, cancellationToken);
            if (!exists) return results;

#pragma warning disable SKEXP0070, CS0618
            var embeddingService = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
#pragma warning restore SKEXP0070, CS0618

            var queryEmbedding = await embeddingService.GenerateEmbeddingAsync(queryText, cancellationToken: cancellationToken);

            var searchResults = await _qdrantClient.SearchAsync(
                _collectionName,
                queryEmbedding.ToArray(),
                limit: (ulong)maxResults,
                cancellationToken: cancellationToken
            );

            foreach (var item in searchResults)
            {
                if (item.Score >= 0.60f && item.Payload.TryGetValue("content", out var contentValue))
                {
                    results.Add(contentValue.StringValue);
                }
            }
        }
        catch (Exception ex)
        {
            // Ghi nhận cảnh báo và tự động bỏ qua RAG nếu Qdrant DB đang offline, giúp Ollama AI vẫn trả lời bình thường!
            Console.WriteLine($"[Qdrant Warning] Vector DB is unreachable on port 6333. Fallback to direct Ollama chat: {ex.Message}");
        }

        return results;
    }

    private List<string> ChunkText(string text, int chunkSize, int overlap)
    {
        var chunks = new List<string>();
        if (string.IsNullOrEmpty(text)) return chunks;
        
        // 1. Semantic Splitting: Ưu tiên cắt theo đoạn văn (Paragraphs) để giữ toàn vẹn ngữ cảnh
        var paragraphs = text.Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries);
        
        var currentChunk = new System.Text.StringBuilder();
        foreach (var p in paragraphs)
        {
            if (currentChunk.Length + p.Length > chunkSize && currentChunk.Length > 0)
            {
                chunks.Add(currentChunk.ToString().Trim());
                // Không xóa toàn bộ, giữ lại overlap cơ bản nếu cần (ở đây đơn giản hóa bằng Clear)
                currentChunk.Clear(); 
            }
            currentChunk.AppendLine(p);
        }
        
        if (currentChunk.Length > 0)
        {
            chunks.Add(currentChunk.ToString().Trim());
        }

        // 2. Nếu có đoạn văn nào quá dài (vượt chunkSize), tiếp tục cắt theo câu (Sentences)
        var finalChunks = new List<string>();
        foreach (var c in chunks)
        {
            if (c.Length <= chunkSize)
            {
                finalChunks.Add(c);
            }
            else
            {
                var sentences = c.Split(new[] { ". ", ".\n" }, StringSplitOptions.RemoveEmptyEntries);
                var subChunk = new System.Text.StringBuilder();
                foreach (var s in sentences)
                {
                    if (subChunk.Length + s.Length > chunkSize && subChunk.Length > 0)
                    {
                        finalChunks.Add(subChunk.ToString().Trim() + ".");
                        subChunk.Clear();
                    }
                    subChunk.Append(s).Append(". ");
                }
                if (subChunk.Length > 0)
                {
                    finalChunks.Add(subChunk.ToString().Trim());
                }
            }
        }

        return finalChunks.Count > 0 ? finalChunks : new List<string> { text };
    }
}
