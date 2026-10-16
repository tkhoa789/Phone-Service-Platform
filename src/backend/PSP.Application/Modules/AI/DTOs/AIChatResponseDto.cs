using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.AI.DTOs;

/// <summary>
/// DTO CHỨA PHẢN HỒI TỪ TRỢ LÝ AI (AIChatResponseDto)
/// 
/// Lớp này định nghĩa cấu trúc dữ liệu trả về cho Client sau khi AI xử lý xong câu hỏi.
/// </summary>
public class AIChatResponseDto
{
    /// <summary>
    /// Mã định danh cuộc hội thoại hiện tại.
    /// Giúp Client lưu lại để gửi tiếp ở các tin nhắn sau, nhằm duy trì mạch hội thoại.
    /// </summary>
    public Guid ConversationId { get; set; }

    /// <summary>
    /// Nội dung câu trả lời bằng ngôn ngữ tự nhiên sinh ra từ AI.
    /// </summary>
    public string Response { get; set; } = string.Empty;

    /// <summary>
    /// Danh sách các thẻ hành động (Action Cards).
    /// Đây là tính năng nâng cao giúp người dùng click vào nút trên khung chat để thực hiện hành động nhanh.
    /// Ví dụ: ["Tạo phiếu chuyển kho", "Xem hóa đơn"]. Hiện tại trả về danh sách rỗng.
    /// </summary>
    public List<string> ActionCards { get; set; } = new List<string>();
}
