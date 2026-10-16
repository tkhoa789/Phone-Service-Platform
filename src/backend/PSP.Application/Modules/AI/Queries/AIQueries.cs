using MediatR;
using PSP.Application.Modules.AI.DTOs;
using System;
using System.Collections.Generic;

namespace PSP.Application.Modules.AI.Queries;

/// <summary>
/// TRUY VẤN DANH SÁCH CUỘC HỘI THOẠI AI (GetAIConversationsQuery)
/// 
/// Lấy toàn bộ danh sách phòng chat cũ của người dùng đang đăng nhập để hiển thị trên sidebar.
/// Trả về danh sách đối tượng `AIConversationDto`.
/// </summary>
public record GetAIConversationsQuery : IRequest<List<AIConversationDto>>;

/// <summary>
/// TRUY VẤN CHI TIẾT TIN NHẮN TRONG CUỘC HỘI THOẠI (GetAIConversationDetailQuery)
/// 
/// Load toàn bộ lịch sử tin nhắn hỏi-đáp của một phòng chat cụ thể dựa trên ConversationId.
/// </summary>
/// <param name="ConversationId">Mã định danh cuộc hội thoại cần lấy chi tiết tin nhắn.</param>
public record GetAIConversationDetailQuery(
    Guid ConversationId
) : IRequest<List<AIMessageDto>>;
