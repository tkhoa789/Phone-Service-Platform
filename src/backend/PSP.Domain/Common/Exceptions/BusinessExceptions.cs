namespace PSP.Domain.Common.Exceptions;

/// <summary>
/// Exception cơ sở cho tất cả lỗi nghiệp vụ.
/// Tuân thủ CODING_RULE: Không throw RuntimeException chung chung.
/// </summary>
public abstract class BusinessException : Exception
{
    public string ErrorCode { get; }

    protected BusinessException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class NotFoundException : BusinessException
{
    public NotFoundException(string entityName, object key)
        : base("NOT_FOUND", $"{entityName} với khóa '{key}' không tồn tại.") { }
}

public class ConflictException : BusinessException
{
    public ConflictException(string message)
        : base("CONFLICT", message) { }
}

public class ForbiddenException : BusinessException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.")
        : base("FORBIDDEN", message) { }
}

public class UnauthorizedException : BusinessException
{
    public UnauthorizedException(string message = "Yêu cầu xác thực để truy cập tài nguyên này.")
        : base("UNAUTHORIZED", message) { }
}

public class BadRequestException : BusinessException
{
    public BadRequestException(string message)
        : base("BAD_REQUEST", message) { }
}

/// <summary>
/// Lỗi khi tồn kho không đủ để xuất bán.
/// Tuân thủ BR-INV-01: Không cho phép bán nếu tồn kho < số lượng mua.
/// </summary>
public class InventoryNotEnoughException : BusinessException
{
    public InventoryNotEnoughException(string productName, int requested, int available)
        : base("INVENTORY_NOT_ENOUGH",
            $"Tồn kho không đủ cho sản phẩm '{productName}'. Yêu cầu: {requested}, Hiện có: {available}.") { }
}

/// <summary>
/// Lỗi khi IMEI không hợp lệ hoặc không đúng trạng thái.
/// </summary>
public class InvalidImeiStatusException : BusinessException
{
    public InvalidImeiStatusException(string imei, string currentStatus, string expectedStatus)
        : base("INVALID_IMEI_STATUS",
            $"IMEI '{imei}' đang ở trạng thái '{currentStatus}', yêu cầu trạng thái '{expectedStatus}'.") { }
}

/// <summary>
/// Lỗi khi vi phạm luồng trạng thái sửa chữa.
/// Tuân thủ BUSINESS_RULE_AI: Không cho phép lùi trạng thái phiếu sửa chữa.
/// </summary>
public class InvalidRepairStatusTransitionException : BusinessException
{
    public InvalidRepairStatusTransitionException(string from, string to)
        : base("INVALID_REPAIR_STATUS_TRANSITION",
            $"Không thể chuyển trạng thái phiếu sửa chữa từ '{from}' sang '{to}'. Chỉ được đi theo chiều tiến.") { }
}
