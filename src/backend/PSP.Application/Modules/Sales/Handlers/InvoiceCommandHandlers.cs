using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Sales.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các Lệnh (Commands) cho Hóa đơn & Thanh toán (Invoice & Payment).
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này xử lý việc tạo hóa đơn từ đơn hàng, ghi nhận từng đợt thanh toán của khách.
/// - Áp dụng quy tắc BR-801: Khi tổng số tiền thanh toán thành công bằng đúng số tiền trên hóa đơn, tự động cập nhật hóa đơn thành "Paid" (Đã thanh toán) và cập nhật trạng thái đơn hàng thành "Completed" (để tự động trừ kho).
/// - Áp dụng quy tắc BR-803: Khóa, chặn mọi giao dịch thanh toán hoặc chỉnh sửa thêm khi hóa đơn đã trả đủ tiền (Paid).
/// </summary>
public class InvoiceCommandHandlers :
    IRequestHandler<CreateInvoiceCommand, Guid>,
    IRequestHandler<CreatePaymentCommand, Guid>,
    IRequestHandler<CancelInvoiceCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IScopeContextService _scopeContext;

    public InvoiceCommandHandlers(
        IUnitOfWork unitOfWork, 
        IMediator mediator, 
        ICurrentUserService currentUserService, 
        IIdempotencyService idempotencyService,
        IScopeContextService? scopeContext = null)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
        _currentUserService = currentUserService;
        _idempotencyService = idempotencyService;
        _scopeContext = scopeContext ?? new ScopeContextService(currentUserService);
    }

    /// <summary>
    /// Tạo hóa đơn tài chính mới từ một Đơn bán hàng (SalesOrder).
    /// </summary>
    public async Task<Guid> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var salesOrderItemRepo = _unitOfWork.Repository<SalesOrderItemEntity>();
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();
        var invoiceItemRepo = _unitOfWork.Repository<InvoiceItemEntity>();

        // 1. Tìm đơn hàng cần xuất hóa đơn
        var order = await salesOrderRepo.GetByIdAsync(request.SalesOrderId, cancellationToken);
        if (order == null)
        {
            throw new NotFoundException("Đơn hàng", request.SalesOrderId);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(order.BranchId, "đơn hàng");

        // 2. Chặn xuất hóa đơn trùng lặp (Mỗi đơn hàng chỉ có tối đa 1 hóa đơn)
        var existingInvoices = await invoiceRepo.FindAsync(x => x.SalesOrderId == order.Id && !x.IsDeleted, cancellationToken);
        if (existingInvoices.Any())
        {
            throw new ConflictException($"Đơn hàng với mã '{order.Code}' đã được xuất hóa đơn trước đó.");
        }

        // 3. Tạo mã hóa đơn độc nhất
        var invoiceCode = "INV-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        // 4. Khởi tạo hóa đơn chính
        var invoice = new InvoiceEntity
        {
            BranchId = order.BranchId,
            SalesOrderId = order.Id,
            Code = invoiceCode,
            Status = InvoiceStatus.Issued, // Trạng thái sẵn sàng để thanh toán
            Amount = order.Total // Tổng tiền cần thanh toán bằng đúng thực thu đơn hàng (sau voucher)
        };

        await invoiceRepo.AddAsync(invoice, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Sao chép chi tiết các mặt hàng từ đơn sang hóa đơn
        var orderItems = await salesOrderItemRepo.FindAsync(x => x.SalesOrderId == order.Id, cancellationToken);
        foreach (var orderItem in orderItems)
        {
            var invoiceItem = new InvoiceItemEntity
            {
                InvoiceId = invoice.Id,
                ProductVariantId = orderItem.ProductVariantId,
                Quantity = orderItem.Quantity,
                UnitPrice = orderItem.UnitPrice // Lưu giá gốc mặt hàng
            };
            await invoiceItemRepo.AddAsync(invoiceItem, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return invoice.Id;
    }

    /// <summary>
    /// Ghi nhận giao dịch thanh toán thực tế (Cả Happy Path lẫn chặn lỗi).
    /// </summary>
    public async Task<Guid> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();
        var paymentMethodRepo = _unitOfWork.Repository<PaymentMethodEntity>();
        var paymentRepo = _unitOfWork.Repository<PaymentEntity>();

        // 1. Kiểm tra sự tồn tại của hóa đơn
        var invoice = await invoiceRepo.GetByIdAsync(request.InvoiceId, cancellationToken);
        if (invoice == null)
        {
            throw new NotFoundException("Hóa đơn", request.InvoiceId);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(invoice.BranchId, "hóa đơn");

        // BR-803: Không cho phép thanh toán cho hóa đơn đã Paid hoặc đã Cancelled
        if (invoice.Status == InvoiceStatus.Paid)
        {
            throw new BadRequestException("Hóa đơn này đã được thanh toán đầy đủ, không thể thực hiện thêm giao dịch.");
        }
        if (invoice.Status == InvoiceStatus.Cancelled)
        {
            throw new BadRequestException("Hóa đơn này đã bị hủy bỏ, không thể tiến hành thanh toán.");
        }

        // 2. Kiểm tra phương thức thanh toán
        var method = await paymentMethodRepo.GetByIdAsync(request.PaymentMethodId, cancellationToken);
        if (method == null)
        {
            throw new NotFoundException("Phương thức thanh toán", request.PaymentMethodId);
        }
        if (!method.IsActive)
        {
            throw new BadRequestException($"Phương thức thanh toán '{method.Name}' đã ngừng kích hoạt.");
        }

        // 3. Kiểm tra trùng lặp mã giao dịch đối soát (Code)
        var duplicatePayments = await paymentRepo.FindAsync(p => p.Code == request.Code.Trim() && !p.IsDeleted, cancellationToken);
        if (duplicatePayments.Any())
        {
            throw new ConflictException($"Mã giao dịch đối soát '{request.Code}' đã tồn tại trên hệ thống.");
        }

        // 4. Tính toán số tiền đã trả trước đó để kiểm soát việc trả thừa
        var pastPayments = await paymentRepo.FindAsync(p => p.InvoiceId == invoice.Id && p.Status == PaymentStatus.Completed, cancellationToken);
        decimal paidSoFar = pastPayments.Sum(p => p.Amount);
        decimal remaining = invoice.Amount - paidSoFar;

        if (request.Amount > remaining)
        {
            throw new BadRequestException($"Số tiền gửi lên ({request.Amount:N0}đ) vượt quá dư nợ còn lại của hóa đơn ({remaining:N0}đ).");
        }

        // 5. Ghi nhận giao dịch thanh toán mới trong transaction nguyên tử
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var payment = new PaymentEntity
            {
                InvoiceId = invoice.Id,
                PaymentMethodId = request.PaymentMethodId,
                Code = request.Code.Trim(),
                Amount = request.Amount,
                Status = PaymentStatus.Completed, // Ghi nhận thành công trực tiếp
                PaymentDate = DateTime.UtcNow
            };

            await paymentRepo.AddAsync(payment, cancellationToken);

            // 6. Kiểm tra xem hóa đơn đã được thanh toán đầy đủ chưa (BR-801)
            decimal totalPaid = paidSoFar + request.Amount;
            if (totalPaid >= invoice.Amount)
            {
                // Cập nhật trạng thái hóa đơn sang Paid
                invoice.Status = InvoiceStatus.Paid;
            }
            
            // Luôn trigger UPDATE trên InvoiceEntity để cập nhật RowVersion (ngăn chặn concurrency double payment)
            invoice.UpdatedAt = DateTime.UtcNow;
            invoiceRepo.Update(invoice);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (_idempotencyService != null)
            {
                _idempotencyService.AttachRecord(payment.Id);
            }

            // Tự động cập nhật trạng thái Đơn hàng sang Completed (Kích hoạt trừ kho và IMEI) trong cùng transaction nguyên tử
            if (invoice.Status == InvoiceStatus.Paid && invoice.SalesOrderId.HasValue)
            {
                await _mediator.Send(new UpdateSalesOrderStatusCommand(invoice.SalesOrderId.Value, SalesOrderStatus.Completed), cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return payment.Id;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ConflictException("Giao dịch thanh toán đang bị xung đột với một giao dịch khác. Vui lòng thử lại.");
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Hủy hóa đơn (Chỉ cho phép khi chưa thanh toán).
    /// </summary>
    public async Task<bool> Handle(CancelInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();

        var invoice = await invoiceRepo.GetByIdAsync(request.Id, cancellationToken);
        if (invoice == null)
        {
            throw new NotFoundException("Hóa đơn", request.Id);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(invoice.BranchId, "hóa đơn");

        if (invoice.Status == InvoiceStatus.Paid)
        {
            throw new BadRequestException("Không thể hủy hóa đơn đã được thanh toán đầy đủ.");
        }

        invoice.Status = InvoiceStatus.Cancelled;
        invoiceRepo.Update(invoice);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
