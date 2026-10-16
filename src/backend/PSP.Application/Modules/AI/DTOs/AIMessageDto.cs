using System;

namespace PSP.Application.Modules.AI.DTOs;

/// <summary>
/// DTO CHI TIẾT TIN NHẮN TRONG HỘI THOẠI (AIMessageDto)
/// 
/// Dùng để hiển thị lịch sử các bong bóng chat (tin nhắn hỏi và trả lời) trong một cuộc hội thoại.
/// </summary>
public class AIMessageDto
{
    /// <summary>
    /// Mã định danh tin nhắn.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Vai trò người gửi. 
    /// Thường nhận 3 giá trị: "user" (người dùng), "assistant" (AI Trợ lý), hoặc "system" (hệ thống).
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Nội dung tin nhắn thô.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Thời gian tin nhắn được gửi/sinh ra.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
