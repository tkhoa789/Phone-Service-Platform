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
    Disposed,       // Đã thanh lý / đổi máy
    WrittenOff      // Đã xuất hủy (FE-3 Repair WriteOff)
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
/// Lý do từ chối bảo hành.
/// </summary>
public enum RejectReason
{
    WaterDamage,              // Thấm nước / ẩm quỳ tím
    Dropped,                  // Rơi vỡ / cấn móp / biến dạng ngoại lực
    ThirdPartyIntervention,   // Tem rách / can thiệp sửa chữa ngoài trái phép
    Expired,                  // Hết hạn bảo hành
    Other                     // Lý do khác
}

/// <summary>
/// Trạng thái phụ khi gửi bảo hành tại trung tâm bảo hành hãng (OEM RMA).
/// </summary>
public enum VendorSubStatus
{
    AtVendor,   // Đang tại trung tâm bảo hành hãng
    Returned    // Hãng đã xử lý xong và gửi trả về shop
}

/// <summary>
/// Trạng thái phiếu sửa chữa.
/// Tuân thủ BUSINESS_RULE_AI: Chỉ được đi theo chiều tiến,
/// không cho phép lùi trạng thái.
/// Tiếp nhận -> Chờ linh kiện -> Đang sửa -> Hoàn thành / Hủy
/// </summary>
public enum RepairTicketStatus
{
    PendingAssignment,  // Chờ phân công
    Received,           // Tiếp nhận
    Diagnosing,         // Chẩn đoán (BUS-001)
    WaitingApproval,    // Chờ khách đồng ý (BUS-001)
    WaitingForParts,    // Chờ linh kiện
    Repairing,          // Đang sửa
    WaitingQC,          // Chờ QC kiểm tra (BUS-001)
    Completed,          // Hoàn thành sửa chữa
    WaitingPickup,      // Chờ khách lấy (BUS-001)
    Delivered,          // Đã giao khách (BUS-001)
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

/// <summary>
/// Trạng thái Tiền cọc (Deposit) của Phiếu sửa chữa.
/// </summary>
public enum RepairDepositStatus
{
    Paid,             // Khách đã đóng cọc
    Applied,          // Đã được cấn trừ vào hóa đơn thanh toán
    RefundRequested,  // Yêu cầu hoàn tiền (chờ thủ quỹ)
    Refunded          // Đã hoàn tiền cho khách (nếu hủy phiếu)
}

/// <summary>
/// Trạng thái của linh kiện thay thế trong Phiếu sửa chữa (FE-3).
/// </summary>
public enum RepairPartStatus
{
    Reserved,
    Issued,
    Installed,
    Returned,
    WriteOff
}

/// <summary>
/// Loại giao dịch tồn kho cho Ledger.
/// </summary>
public enum InventoryTransactionType
{
    REPAIR_ISSUE,
    REPAIR_RETURN,
    REPAIR_WRITEOFF,
    IMPORT,
    SALE,
    SALE_RETURN,
    TRANSFER_OUT,
    TRANSFER_IN,
    TRANSFER_CANCEL_RETURN,
    STOCKTAKE_ADJUSTMENT
}
