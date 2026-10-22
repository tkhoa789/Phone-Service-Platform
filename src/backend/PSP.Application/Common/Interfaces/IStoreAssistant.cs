using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// GIAO DIỆN TRỢ LÝ CỬA HÀNG AI (IStoreAssistant)
/// 
/// Định nghĩa các tính năng mà AI Assistant cung cấp cho tầng nghiệp vụ (Application).
/// Bao gồm phân tích cảnh báo tồn kho, trò chuyện hội thoại, nạp tài liệu và tìm kiếm vector RAG.
/// </summary>
public interface IStoreAssistant
{
    /// <summary>
    /// Gọi mô hình AI để phân tích và đưa ra giải pháp xử lý tồn kho thấp.
    /// </summary>
    Task<string> AnalyzeInsightAsync(string prompt, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gọi mô hình AI trò chuyện tự nhiên kết hợp tri thức RAG và kiểm soát phân quyền Tool Calling.
    /// </summary>
    Task<string> ChatAsync(string systemPrompt, string userMessage, List<string> ragContexts, AISecurityContext? securityContext = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gọi mô hình AI và trả về kết quả dạng luồng (Streaming) có kiểm soát phân quyền Tool Calling.
    /// </summary>
    IAsyncEnumerable<string> ChatStreamAsync(string systemPrompt, string userMessage, List<string> ragContexts, AISecurityContext? securityContext = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cắt nhỏ, tạo vector và lưu tài liệu tri thức vào Vector DB (Qdrant).
    /// </summary>
    Task IngestDocumentAsync(string title, string content, string sourceType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tìm kiếm tài liệu có nghĩa tương đồng từ Vector DB (Qdrant RAG Search).
    /// </summary>
    Task<List<string>> SearchSimilarDocsAsync(string queryText, int maxResults = 3, CancellationToken cancellationToken = default);
}
