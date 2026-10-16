using System;
using MediatR;
using PSP.Domain.Common.Enums;

namespace PSP.Application.Modules.Repair.Commands;

/// <summary>
/// Lệnh thu tiền cọc cho phiếu sửa chữa.
/// </summary>
public record CreateRepairDepositCommand(
    Guid RepairTicketId,
    decimal Amount,
    Guid PaymentMethodId,
    string? TransactionCode,
    string IdempotencyKey
) : IRequest<Guid>;

/// <summary>
/// Lệnh hoàn trả tiền cọc cho khách hàng (thường dùng khi Hủy phiếu).
/// </summary>
public record RefundRepairDepositCommand(
    Guid DepositId
) : IRequest<bool>;
