using System;

namespace PSP.Application.Modules.AI.DTOs;

/// <summary>
/// DTO CHỨA YÊU CẦU CHAT VỚI TRỢ LÝ AI (AIChatRequestDto)
/// 
/// Lớp này đóng vai trò định nghĩa cấu trúc dữ liệu đầu vào mà phía Client (giao diện chat hoặc Postman)
/// sẽ gửi lên khi muốn trò chuyện với AI.
/// </summary>
public class AIChatRequestDto
{
    /// <summary>
    /// Mã định danh cuộc hội thoại (UUID).
    /// Nếu gửi lên một mã Guid có sẵn, AI sẽ tìm cuộc hội thoại cũ để chat tiếp nhằm giữ ngữ cảnh (context).
    /// Nếu truyền null hoặc rỗng, hệ thống sẽ tự động tạo cuộc hội thoại mới.
    /// </summary>
    public Guid? ConversationId { get; set; }

    /// <summary>
    /// Nội dung tin nhắn của người dùng gửi cho AI.
    /// Ví dụ: "Chính sách bảo hành màn hình iPhone 13 thế nào?"
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
