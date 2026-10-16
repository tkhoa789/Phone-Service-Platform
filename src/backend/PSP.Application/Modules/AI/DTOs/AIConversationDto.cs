using System;

namespace PSP.Application.Modules.AI.DTOs;

/// <summary>
/// DTO TÓM TẮT CUỘC HỘI THOẠI AI (AIConversationDto)
/// 
/// Dùng để hiển thị danh sách các phòng chat/cuộc hội thoại cũ của người dùng ở sidebar.
/// </summary>
public class AIConversationDto
{
    /// <summary>
    /// Mã định danh cuộc hội thoại.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tiêu đề cuộc hội thoại (thường tự sinh từ câu hỏi đầu tiên của người dùng).
    /// Ví dụ: "Hỏi về chính sách bảo hành iPhone"
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Thời gian tạo cuộc hội thoại.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Thời gian cập nhật tin nhắn cuối cùng trong cuộc hội thoại.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
