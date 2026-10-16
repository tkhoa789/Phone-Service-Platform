using MediatR;
using PSP.Application.Modules.AI.DTOs;
using System;

namespace PSP.Application.Modules.AI.Commands;

/// <summary>
/// LỆNH GỬI TIN NHẮN CHAT VỚI AI (SendAIMessageCommand)
/// 
/// Lập trình viên mới học: Đây là một Record (C# 9+) kế thừa từ IRequest của thư viện MediatR.
/// Nó chứa dữ liệu cần thiết để gửi đi một yêu cầu trò chuyện.
/// Kết quả kỳ vọng nhận lại sau khi thực thi Handler là một đối tượng `AIChatResponseDto`.
/// </summary>
/// <param name="ConversationId">Id cuộc hội thoại cũ (nếu có, để chat tiếp mạch cũ). Nếu null sẽ sinh hội thoại mới.</param>
/// <param name="Message">Nội dung câu hỏi của người dùng.</param>
public record SendAIMessageCommand(
    Guid? ConversationId,
    string Message
) : IRequest<AIChatResponseDto>;

/// <summary>
/// LỆNH GỬI TIN NHẮN CHAT VỚI AI VÀ NHẬN KẾT QUẢ THEO STREAM
/// </summary>
public record SendAIMessageStreamCommand(
    Guid? ConversationId,
    string Message
) : IStreamRequest<string>;

/// <summary>
/// LỆNH NẠP TÀI LIỆU TRI THỨC VÀO VECTOR DB (IngestKnowledgeDocumentCommand)
/// 
/// Dùng để lưu trữ tài liệu nghiệp vụ (chính sách, kỹ thuật) vào Qdrant nhằm phục vụ cơ chế RAG.
/// </summary>
/// <param name="Title">Tiêu đề tài liệu (ví dụ: "Chính sách bảo hành 2026").</param>
/// <param name="Content">Nội dung văn bản thô của tài liệu.</param>
/// <param name="SourceType">Loại tài liệu (ví dụ: "Warranty", "RepairGuide").</param>
/// <param name="SourceUrl">Đường dẫn nguồn tài liệu nếu có (ví dụ: url file pdf).</param>
public record IngestKnowledgeDocumentCommand(
    string Title,
    string Content,
    string SourceType,
    string? SourceUrl = null
) : IRequest<bool>;
