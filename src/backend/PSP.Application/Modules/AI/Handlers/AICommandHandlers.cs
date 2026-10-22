using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.AI.Commands;
using PSP.Application.Modules.AI.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.AI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.AI.Handlers;

/// <summary>
/// HANDLER XỬ LÝ LỆNH GỬI TIN NHẮN CHAT VỚI AI (SendAIMessageCommandHandler)
/// 
/// Lập trình viên mới học: Lớp này triển khai IRequestHandler từ thư viện MediatR.
/// Nó chứa logic nghiệp vụ chính (Business Logic) khi có yêu cầu gửi tin nhắn chat.
/// Quy trình:
/// 1. Xác thực người dùng đăng nhập qua ICurrentUserService.
/// 2. Lấy hoặc tạo mới cuộc hội thoại (AIConversationEntity) trong SQL Server.
/// 3. Lấy lịch sử chat cũ của phòng chat này để AI hiểu bối cảnh trước đó.
/// 4. Thực hiện RAG: Tìm kiếm các đoạn tài liệu tương đồng trong Qdrant Vector DB thông qua StoreAssistant.
/// 5. Gửi prompt tích hợp ngữ cảnh sang Ollama (qwen2.5:7b) để nhận câu trả lời.
/// 6. Lưu cả tin nhắn hỏi của người dùng và câu trả lời của AI vào SQL Server.
/// </summary>
public class SendAIMessageCommandHandler : IRequestHandler<SendAIMessageCommand, AIChatResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IStoreAssistant _storeAssistant;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAIAuthorizationService _aiAuthService;

    public SendAIMessageCommandHandler(
        IAppDbContext context, 
        IStoreAssistant storeAssistant, 
        ICurrentUserService currentUserService,
        IAIAuthorizationService? aiAuthService = null)
    {
        _context = context;
        _storeAssistant = storeAssistant;
        _currentUserService = currentUserService;
        _aiAuthService = aiAuthService ?? new PSP.Application.Common.Security.AIAuthorizationService(
            currentUserService,
            new PSP.Application.Common.Security.ScopeContextService(currentUserService),
            new PSP.Application.Common.Security.FieldVisibilityService(currentUserService));
    }

    public async Task<AIChatResponseDto> Handle(SendAIMessageCommand request, CancellationToken cancellationToken)
    {
        // 1. Thẩm định quyền và lấy ngữ cảnh bảo mật người dùng (RBAC-01..06)
        var securityContext = await _aiAuthService.ValidateAndGetSecurityContextAsync(cancellationToken);
        var userId = securityContext.UserId;
        AIConversationEntity? conversation = null;

        // 2. Tìm hoặc Tạo mới phòng chat (Hội thoại) - Cô lập SELF Scope (RBAC-03)
        if (request.ConversationId.HasValue && request.ConversationId.Value != Guid.Empty)
        {
            conversation = await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value && c.UserId == userId, cancellationToken);
            
            if (conversation == null)
            {
                throw new NotFoundException("AIConversation", request.ConversationId.Value);
            }
        }
        else
        {
            var title = request.Message.Length > 50 
                ? request.Message.Substring(0, 47) + "..." 
                : request.Message;

            conversation = new AIConversationEntity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.AIConversations.AddAsync(conversation, cancellationToken);
        }

        // 3. Quét kiểm tra bảo mật tiền thực thi (Pre-Execution Adversarial & Visibility Filter)
        var validation = _aiAuthService.ValidateAndSanitizeInput(request.Message, securityContext);
        if (validation.IsBlocked)
        {
            var userBlockedMsg = new AIMessageEntity
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "user",
                Content = request.Message,
                CreatedAt = DateTime.UtcNow
            };

            var assistantRefusalMsg = new AIMessageEntity
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "assistant",
                Content = validation.DeterministicRefusalResponse!,
                CreatedAt = DateTime.UtcNow
            };

            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.AIMessages.AddAsync(userBlockedMsg, cancellationToken);
            await _context.AIMessages.AddAsync(assistantRefusalMsg, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new AIChatResponseDto
            {
                ConversationId = conversation.Id,
                Response = validation.DeterministicRefusalResponse!,
                ActionCards = new List<string>()
            };
        }

        // 4. Tìm kiếm tài liệu tri thức liên quan từ Qdrant Vector DB (RAG)
        var rawRagContexts = await _storeAssistant.SearchSimilarDocsAsync(request.Message, maxResults: 3, cancellationToken);

        // 5. Lọc tri thức RAG theo thẩm quyền của người dùng (RAG Context Filter)
        var safeRagContexts = _aiAuthService.FilterRagContexts(rawRagContexts, securityContext);

        // 6. Xây dựng System Prompt kiên cố tích hợp danh tính & ranh giới bảo mật bất biến
        var systemPrompt = _aiAuthService.BuildSecureSystemPrompt(securityContext);

        // 7. Gửi prompt sang Ollama (Qwen) kết hợp Context bảo mật RBAC
        var rawResponse = await _storeAssistant.ChatAsync(systemPrompt, request.Message, safeRagContexts, securityContext, cancellationToken);

        // 8. Quét kiểm duyệt đầu ra hậu thực thi (Post-Execution Leakage Sanitizer)
        var safeResponseText = _aiAuthService.SanitizeOutput(rawResponse, securityContext);

        // 9. Lưu tin nhắn của User và AI vào SQL Server
        var userMessageEntity = new AIMessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        var assistantMessageEntity = new AIMessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = safeResponseText,
            CreatedAt = DateTime.UtcNow
        };

        conversation.UpdatedAt = DateTime.UtcNow;

        await _context.AIMessages.AddAsync(userMessageEntity, cancellationToken);
        await _context.AIMessages.AddAsync(assistantMessageEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AIChatResponseDto
        {
            ConversationId = conversation.Id,
            Response = safeResponseText,
            ActionCards = new List<string>()
        };
    }
}

public class SendAIMessageStreamCommandHandler : IStreamRequestHandler<SendAIMessageStreamCommand, string>
{
    private readonly IAppDbContext _context;
    private readonly IStoreAssistant _storeAssistant;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAIAuthorizationService _aiAuthService;

    public SendAIMessageStreamCommandHandler(
        IAppDbContext context,
        IStoreAssistant storeAssistant,
        ICurrentUserService currentUserService,
        IAIAuthorizationService? aiAuthService = null)
    {
        _context = context;
        _storeAssistant = storeAssistant;
        _currentUserService = currentUserService;
        _aiAuthService = aiAuthService ?? new PSP.Application.Common.Security.AIAuthorizationService(
            currentUserService,
            new PSP.Application.Common.Security.ScopeContextService(currentUserService),
            new PSP.Application.Common.Security.FieldVisibilityService(currentUserService));
    }

    public async IAsyncEnumerable<string> Handle(SendAIMessageStreamCommand request, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // 1. Thẩm định quyền và lấy ngữ cảnh bảo mật người dùng
        var securityContext = await _aiAuthService.ValidateAndGetSecurityContextAsync(cancellationToken);
        var userId = securityContext.UserId;
        AIConversationEntity? conversation = null;

        // 2. Tìm hoặc Tạo mới phòng chat (SELF Scope)
        if (request.ConversationId.HasValue && request.ConversationId.Value != Guid.Empty)
        {
            conversation = await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value && c.UserId == userId, cancellationToken);
            
            if (conversation == null)
            {
                throw new NotFoundException("AIConversation", request.ConversationId.Value);
            }
        }
        else
        {
            var title = request.Message.Length > 50 
                ? request.Message.Substring(0, 47) + "..." 
                : request.Message;

            conversation = new AIConversationEntity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.AIConversations.AddAsync(conversation, cancellationToken);
        }

        // 3. Quét kiểm tra bảo mật tiền thực thi
        var validation = _aiAuthService.ValidateAndSanitizeInput(request.Message, securityContext);
        if (validation.IsBlocked)
        {
            var userBlockedMsg = new AIMessageEntity
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "user",
                Content = request.Message,
                CreatedAt = DateTime.UtcNow
            };

            var assistantRefusalMsg = new AIMessageEntity
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "assistant",
                Content = validation.DeterministicRefusalResponse!,
                CreatedAt = DateTime.UtcNow
            };

            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.AIMessages.AddAsync(userBlockedMsg, cancellationToken);
            await _context.AIMessages.AddAsync(assistantRefusalMsg, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            yield return $"[CONVERSATION_ID:{conversation.Id}]\n";
            yield return validation.DeterministicRefusalResponse!;
            yield break;
        }

        // 4. Tìm kiếm tài liệu tri thức liên quan từ Qdrant
        var rawRagContexts = await _storeAssistant.SearchSimilarDocsAsync(request.Message, maxResults: 3, cancellationToken);

        // 5. Lọc tri thức RAG theo thẩm quyền
        var safeRagContexts = _aiAuthService.FilterRagContexts(rawRagContexts, securityContext);

        // 6. Xây dựng System Prompt kiên cố
        var systemPrompt = _aiAuthService.BuildSecureSystemPrompt(securityContext);

        // 7. Thực hiện stream từ LLM kết hợp Context bảo mật RBAC
        var stream = _storeAssistant.ChatStreamAsync(systemPrompt, request.Message, safeRagContexts, securityContext, cancellationToken);
        
        var fullResponseBuilder = new System.Text.StringBuilder();

        yield return $"[CONVERSATION_ID:{conversation.Id}]\n";

        await foreach (var chunk in stream)
        {
            fullResponseBuilder.Append(chunk);
            yield return chunk;
        }

        // 8. Quét kiểm duyệt chuỗi phản hồi đầy đủ
        var finalCleanResponse = _aiAuthService.SanitizeOutput(fullResponseBuilder.ToString(), securityContext);

        var userMessageEntity = new AIMessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        var assistantMessageEntity = new AIMessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = finalCleanResponse,
            CreatedAt = DateTime.UtcNow
        };

        conversation.UpdatedAt = DateTime.UtcNow;

        await _context.AIMessages.AddAsync(userMessageEntity, cancellationToken);
        await _context.AIMessages.AddAsync(assistantMessageEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

/// <summary>
/// HANDLER XỬ LÝ LỆNH NẠP TÀI LIỆU TRI THỨC VÀO VECTOR DB (IngestKnowledgeDocumentCommandHandler)
/// 
/// Nhiệm vụ:
/// 1. Nhận văn bản tri thức.
/// 2. Gọi StoreAssistant để chunking, tạo vector embedding qua model 'nomic-embed-text' và lưu vào Qdrant.
/// 3. Lưu lịch sử nạp tài liệu vào bảng AIKnowledgeDocuments trong SQL Server để quản lý.
/// </summary>
public class IngestKnowledgeDocumentCommandHandler : IRequestHandler<IngestKnowledgeDocumentCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IStoreAssistant _storeAssistant;

    public IngestKnowledgeDocumentCommandHandler(IAppDbContext context, IStoreAssistant storeAssistant)
    {
        _context = context;
        _storeAssistant = storeAssistant;
    }

    public async Task<bool> Handle(IngestKnowledgeDocumentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.Content))
        {
            throw new ArgumentException("Nội dung tài liệu nạp vào không được để trống.");
        }

        // 1. Thực hiện đẩy tài liệu sang Qdrant Vector DB
        await _storeAssistant.IngestDocumentAsync(
            title: request.Title, 
            content: request.Content, 
            sourceType: request.SourceType, 
            cancellationToken: cancellationToken
        );

        // 2. Đồng bộ lưu vết tài liệu tri thức vào SQL Server
        var knowledgeDoc = new AIKnowledgeDocumentEntity
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Content = request.Content,
            SourceType = request.SourceType,
            SourceUrl = request.SourceUrl,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _context.AIKnowledgeDocuments.AddAsync(knowledgeDoc, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
