using Microsoft.EntityFrameworkCore;
using PSP.Domain.Modules.AI.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// GIAO DIỆN KẾT NỐI DATABASE (IAppDbContext)
/// 
/// Lập trình viên mới học: Theo nguyên tắc Clean Architecture, tầng Application không được
/// tham chiếu trực tiếp đến các class ở tầng Infrastructure (như AppDbContext).
/// Do đó, ta tạo Interface này ở tầng Application để làm cầu nối trung gian.
/// Tầng Infrastructure sẽ thực hiện cài đặt (implement) nó.
/// </summary>
public interface IAppDbContext
{
    /// <summary>
    /// Bảng hội thoại AI
    /// </summary>
    DbSet<AIConversationEntity> AIConversations { get; }

    /// <summary>
    /// Bảng tin nhắn hội thoại AI
    /// </summary>
    DbSet<AIMessageEntity> AIMessages { get; }

    /// <summary>
    /// Bảng lịch sử gọi công cụ của AI
    /// </summary>
    DbSet<AIToolCallEntity> AIToolCalls { get; }

    /// <summary>
    /// Bảng tài liệu tri thức phục vụ RAG
    /// </summary>
    DbSet<AIKnowledgeDocumentEntity> AIKnowledgeDocuments { get; }

    /// <summary>
    /// Hàm lưu các thay đổi xuống Database vật lý
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
