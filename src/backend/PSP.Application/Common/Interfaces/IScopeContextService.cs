using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PSP.Application.Common.Interfaces;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// Dịch vụ quản lý và thẩm định ranh giới phạm vi dữ liệu (Scope Boundaries) cho RBAC-03.
/// Ngăn chặn rò rỉ dữ liệu chéo chi nhánh (BOLA/IDOR), chống giả mạo tham số client,
/// và đảm bảo nguyên tắc an toàn Fail-Closed.
/// </summary>
public interface IScopeContextService
{
    /// <summary>
    /// Kiểm tra người dùng có thuộc phạm vi toàn chuỗi ENTERPRISE hay không (Owner, Admin).
    /// </summary>
    bool IsEnterpriseScope { get; }

    /// <summary>
    /// Lấy BranchId bắt buộc từ JWT claim của người dùng.
    /// Nếu người dùng thuộc phạm vi BRANCH nhưng không có BranchId hợp lệ -> Quăng lỗi ForbiddenException (Fail-Closed).
    /// </summary>
    Guid GetRequiredBranchId();

    /// <summary>
    /// Thẩm định tham số chi nhánh từ client (query/body) đối chiếu với quyền hạn.
    /// Nếu là Enterprise: Trả về branchId được yêu cầu (hoặc null nếu xem toàn chuỗi).
    /// Nếu là Branch: Trả về BranchId của người dùng; nếu client gửi branchId khác -> Quăng lỗi ForbiddenException.
    /// </summary>
    Guid? GetEffectiveBranchFilter(Guid? requestedBranchId = null);

    /// <summary>
    /// Thẩm định một thực thể có BranchId cụ thể có nằm trong phạm vi được phép của người dùng hay không.
    /// Quăng lỗi ForbiddenException nếu người dùng thuộc chi nhánh khác.
    /// </summary>
    void ValidateBranchAccess(Guid? targetBranchId, string resourceName = "dữ liệu");

    /// <summary>
    /// Thẩm định quyền thực thi của Kỹ thuật viên (Technician) trên phiếu sửa chữa (ASSIGNED Scope).
    /// Kỹ thuật viên chỉ được phép thực thi trên phiếu được phân công cho mình hoặc phiếu chưa phân công.
    /// </summary>
    void ValidateTechnicianExecution(Guid? ticketTechnicianId, Guid? ticketBranchId);

    /// <summary>
    /// Lấy danh sách ID các kho hàng mà người dùng được phép truy cập.
    /// Với Enterprise: trả về null (không giới hạn kho).
    /// Với Branch/Warehouse: trả về danh sách WarehouseId thuộc chi nhánh của người dùng.
    /// </summary>
    Task<List<Guid>?> GetAccessibleWarehouseIdsAsync(IUnitOfWork unitOfWork, CancellationToken cancellationToken = default);

    /// <summary>
    /// Thẩm định một kho hàng có thuộc phạm vi chi nhánh của người dùng hay không.
    /// </summary>
    Task ValidateWarehouseAccessAsync(IUnitOfWork unitOfWork, Guid warehouseId, string operation = "thao tác trên kho", CancellationToken cancellationToken = default);
}
