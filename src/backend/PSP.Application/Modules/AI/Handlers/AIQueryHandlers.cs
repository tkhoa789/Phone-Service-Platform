using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Exceptions;
using PSP.Application.Modules.AI.DTOs;
using PSP.Application.Modules.AI.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.AI.Handlers;

/// <summary>
/// HANDLER XỬ LÝ TRUY VẤN DANH SÁCH CUỘC HỘI THOẠI AI (GetAIConversationsQueryHandler)
/// 
/// Lập trình viên mới học: Handler này chịu trách nhiệm lấy toàn bộ các cuộc hội thoại chat cũ
/// của chính nhân viên đang đăng nhập hệ thống, phục vụ việc hiển thị menu lịch sử chat.
/// </summary>
public class GetAIConversationsQueryHandler : IRequestHandler<GetAIConversationsQuery, List<AIConversationDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAIConversationsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<AIConversationDto>> Handle(GetAIConversationsQuery request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra đăng nhập
        if (string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("Bạn cần đăng nhập để xem lịch sử hội thoại.");
        }

        var userId = Guid.Parse(_currentUserService.UserId);

        // 2. Truy vấn từ SQL Server danh sách phòng chat của User này, sắp xếp cuộc trò chuyện mới nhất lên đầu
        var conversations = await _context.AIConversations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new AIConversationDto
            {
                Id = c.Id,
                Title = c.Title,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return conversations;
    }
}

/// <summary>
/// HANDLER XỬ LÝ TRUY VẤN CHI TIẾT TIN NHẮN TRONG PHÒNG CHAT (GetAIConversationDetailQueryHandler)
/// 
/// Load toàn bộ các tin nhắn hỏi (user) và đáp (assistant) của một phòng chat cụ thể,
/// sắp xếp theo thứ tự thời gian tăng dần (chọn tin cũ trước, tin mới sau) để hiển thị lên khung chat.
/// </summary>
public class GetAIConversationDetailQueryHandler : IRequestHandler<GetAIConversationDetailQuery, List<AIMessageDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAIConversationDetailQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<AIMessageDto>> Handle(GetAIConversationDetailQuery request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra đăng nhập
        if (string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("Bạn cần đăng nhập để xem chi tiết cuộc hội thoại.");
        }

        var userId = Guid.Parse(_currentUserService.UserId);

        // 2. Xác thực xem cuộc hội thoại này có đúng là của User đang đăng nhập hay không (bảo mật dữ liệu)
        var conversationExists = await _context.AIConversations
            .AnyAsync(c => c.Id == request.ConversationId && c.UserId == userId, cancellationToken);

        if (!conversationExists)
        {
            throw new NotFoundException("AIConversation", request.ConversationId);
        }

        // 3. Lấy toàn bộ tin nhắn thuộc cuộc hội thoại này, xếp theo thời gian gửi tăng dần
        var messages = await _context.AIMessages
            .Where(m => m.ConversationId == request.ConversationId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new AIMessageDto
            {
                Id = m.Id,
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return messages;
    }
}
