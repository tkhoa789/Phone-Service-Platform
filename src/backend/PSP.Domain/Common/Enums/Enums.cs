namespace PSP.Domain.Common.Enums;

/// <summary>
/// Trạng thái IMEI theo vòng đời thiết bị (IMEI Lifecycle).
/// Tham chiếu: ERD.md mục 3.2 - IMEI Entity.
/// </summary>
public enum ImeiStatus
{
    InStock,        // Trong kho
    Sold,           // Đã bán
    Repairing,      // Đang sửa chữa
    WarrantyHold,   // Đang giữ bảo hành
    Disposed        // Đã thanh lý / đổi máy
}

/// <summary>
/// Trạng thái chi nhánh.
/// </summary>
public enum BranchStatus
{
    Active,
    Inactive
}

/// <summary>
/// Trạng thái tài khoản nhân viên.
/// </summary>
public enum UserStatus
{
    Active,
    Inactive,
    Locked
}

/// <summary>
/// Trạng thái đơn hàng bán.
/// </summary>
public enum SalesOrderStatus
{
    Pending,
    Confirmed,
    Completed,
    Cancelled
}

/// <summary>
/// Trạng thái hóa đơn.
/// </summary>
public enum InvoiceStatus
{
    Draft,
    Issued,
    Paid,
    Cancelled
}

/// <summary>
/// Trạng thái thanh toán.
/// </summary>
public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded
}

/// <summary>
/// Trạng thái phiếu bảo hành.
/// </summary>
public enum WarrantyTicketStatus
{
    Received,
    Processing,
    Completed,
    Rejected,
    Cancelled
}

/// <summary>
/// Trạng thái phiếu sửa chữa.
/// Tuân thủ BUSINESS_RULE_AI: Chỉ được đi theo chiều tiến,
/// không cho phép lùi trạng thái.
/// Tiếp nhận -> Chờ linh kiện -> Đang sửa -> Hoàn thành / Hủy
/// </summary>
public enum RepairTicketStatus
{
    Received,           // Tiếp nhận
    WaitingForParts,    // Chờ linh kiện
    Repairing,          // Đang sửa
    Completed,          // Hoàn thành
    Cancelled           // Hủy
}

/// <summary>
/// Trạng thái phiếu nhập kho.
/// </summary>
public enum PurchaseOrderStatus
{
    Draft,
    Confirmed,
    Received,
    Cancelled
}

/// <summary>
/// Trạng thái phiếu chuyển kho.
/// </summary>
public enum WarehouseTransferStatus
{
    Pending,
    InTransit,
    Received,
    Cancelled
}

/// <summary>
/// Trạng thái kiểm kho.
/// </summary>
public enum StockTakeStatus
{
    Draft,
    InProgress,
    Completed,
    Cancelled
}

/// <summary>
/// Trạng thái voucher.
/// </summary>
public enum VoucherStatus
{
    Active,
    Used,
    Expired,
    Cancelled
}

/// <summary>
/// Trạng thái đăng nhập.
/// </summary>
public enum LoginStatus
{
    Success,
    Failed
}
