using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// Ngữ cảnh bảo mật của người dùng tương tác với AI Assistant.
/// Tích hợp đầy đủ danh tính (RBAC-01), quyền hạn (RBAC-02), phạm vi (RBAC-03) và hiển thị trường dữ liệu (RBAC-04).
/// </summary>
public class AISecurityContext
{
    public Guid UserId { get; set; }
    public List<string> Roles { get; set; } = new();
    public string PrimaryRole { get; set; } = "Nhân viên";
    public bool IsEnterpriseScope { get; set; }
    public Guid? BranchId { get; set; }
    public bool CanViewCostPrice { get; set; }
    public bool CanViewProfit { get; set; }
    public bool CanViewSupplierFinancials { get; set; }
    public bool CanViewCustomerFinancials { get; set; }
    public bool HasAnalyticsPermission { get; set; }
}

/// <summary>
/// Kết quả thẩm định và lọc sạch đầu vào của người dùng trước khi gửi cho mô hình LLM.
/// </summary>
public class AIInputValidationResult
{
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public string? DeterministicRefusalResponse { get; set; }
    public string SanitizedMessage { get; set; } = string.Empty;
}

/// <summary>
/// Dịch vụ quản lý luồng ủy quyền và bảo mật toàn diện cho Trợ lý AI (RBAC-06).
/// Ngăn chặn các lỗ hổng: Prompt Injection, Jailbreak, rò rỉ giá vốn, rò rỉ lợi nhuận, rò rỉ công nợ,
/// rò rỉ mật khẩu/token, và vượt ranh giới chi nhánh.
/// </summary>
public interface IAIAuthorizationService
{
    /// <summary>
    /// Thẩm định trạng thái đăng nhập và trích xuất ngữ cảnh bảo mật đầy đủ của người dùng hiện tại.
    /// </summary>
    Task<AISecurityContext> ValidateAndGetSecurityContextAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Xây dựng System Prompt chống Jailbreak / Prompt Injection, tích hợp cứng vai trò, chi nhánh, và ranh giới bảo mật trường dữ liệu.
    /// </summary>
    string BuildSecureSystemPrompt(AISecurityContext context);

    /// <summary>
    /// Thẩm định và làm sạch đầu vào người dùng trước khi gửi cho LLM.
    /// Phát hiện và chặn đứng các nỗ lực Prompt Injection, Jailbreak hoặc cố tình đòi xem trường dữ liệu bị cấm.
    /// </summary>
    AIInputValidationResult ValidateAndSanitizeInput(string userMessage, AISecurityContext context);

    /// <summary>
    /// Lọc các đoạn trích RAG Context từ Qdrant/vector DB để đảm bảo không rò rỉ tài liệu tài chính, bí mật, hoặc vượt quá phạm vi chi nhánh.
    /// </summary>
    List<string> FilterRagContexts(List<string> rawContexts, AISecurityContext context);

    /// <summary>
    /// Kiểm duyệt và làm sạch đầu ra của AI trước khi gửi về client, đảm bảo không có rò rỉ ngẫu nhiên (Leakage Post-Filter).
    /// </summary>
    string SanitizeOutput(string aiResponse, AISecurityContext context);
}
