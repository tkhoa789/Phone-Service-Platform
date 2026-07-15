using PSP.Domain.Common.Entities;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Domain.Modules.AI.Entities;

/// <summary>
/// Hội thoại AI.
/// Tham chiếu: ERD.md - Section 3.5.
/// </summary>
public class AIConversationEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
    public ICollection<AIMessageEntity> Messages { get; set; } = new List<AIMessageEntity>();
    public ICollection<AIToolCallEntity> ToolCalls { get; set; } = new List<AIToolCallEntity>();
}

/// <summary>
/// Tin nhắn trong hội thoại AI.
/// </summary>
public class AIMessageEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public string Role { get; set; } = string.Empty; // user, assistant, system
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public AIConversationEntity Conversation { get; set; } = null!;
}

/// <summary>
/// Lịch sử Tool Calling của AI.
/// </summary>
public class AIToolCallEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public string? Arguments { get; set; }
    public string? Response { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public AIConversationEntity Conversation { get; set; } = null!;
}

/// <summary>
/// Tài liệu tri thức cho RAG.
/// </summary>
public class AIKnowledgeDocumentEntity : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? SourceType { get; set; }
    public string? SourceUrl { get; set; }
}
