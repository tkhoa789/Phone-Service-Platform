using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Sales.DTOs;
using PSP.Application.Modules.Sales.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Application.Modules.Sales.Handlers;

/// <summary>
/// Bộ xử lý các truy vấn (Queries) đọc dữ liệu Hóa đơn & Thanh toán.
/// </summary>
public class InvoiceQueryHandlers :
    IRequestHandler<GetInvoiceByIdQuery, InvoiceDto>,
    IRequestHandler<GetInvoiceBySalesOrderIdQuery, InvoiceDto>,
    IRequestHandler<GetAllInvoicesQuery, IEnumerable<InvoiceDto>>,
    IRequestHandler<GetAllPaymentMethodsQuery, IEnumerable<PaymentMethodDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public InvoiceQueryHandlers(
        IUnitOfWork unitOfWork, 
        ICurrentUserService currentUserService,
        IScopeContextService? scopeContext = null)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext ?? new ScopeContextService(currentUserService);
    }

    /// <summary>
    /// Lấy chi tiết thông tin hóa đơn theo ID kèm các mặt hàng con và danh sách đợt thanh toán liên quan.
    /// </summary>
    public async Task<InvoiceDto> Handle(GetInvoiceByIdQuery request, CancellationToken cancellationToken)
    {
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();
        var salesOrderRepo = _unitOfWork.Repository<SalesOrderEntity>();
        var invoiceItemRepo = _unitOfWork.Repository<InvoiceItemEntity>();
        var paymentRepo = _unitOfWork.Repository<PaymentEntity>();
        var paymentMethodRepo = _unitOfWork.Repository<PaymentMethodEntity>();
        var variantRepo = _unitOfWork.Repository<ProductVariantEntity>();

        // 1. Lấy hóa đơn chính
        var invoice = await invoiceRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (invoice == null)
        {
            throw new NotFoundException("Hóa đơn", request.Id);
        }

        // 2. Lấy thông tin đơn bán hàng liên kết (nếu có)
        PSP.Domain.Modules.Sales.Entities.SalesOrderEntity? order = null;
        if (invoice.SalesOrderId.HasValue)
        {
            order = await salesOrderRepo.GetByIdAsNoTrackingAsync(invoice.SalesOrderId.Value, cancellationToken);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(invoice.BranchId, "hóa đơn");

        // 3. Lấy danh sách mặt hàng của hóa đơn
        var items = await invoiceItemRepo.FindAsNoTrackingAsync(i => i.InvoiceId == invoice.Id, cancellationToken);
        var itemDtos = new List<InvoiceItemDto>();
        foreach (var item in items)
        {
            var variant = await variantRepo.GetByIdAsNoTrackingAsync(item.ProductVariantId, cancellationToken);
            itemDtos.Add(new InvoiceItemDto
            {
                Id = item.Id,
                ProductVariantId = item.ProductVariantId,
                ProductName = variant?.Name ?? "Sản phẩm không xác định",
                Sku = variant?.Sku ?? string.Empty,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        // 4. Lấy danh sách các giao dịch thanh toán
        var payments = await paymentRepo.FindAsNoTrackingAsync(p => p.InvoiceId == invoice.Id, cancellationToken);
        var paymentDtos = new List<PaymentDto>();
        foreach (var payment in payments)
        {
            var method = await paymentMethodRepo.GetByIdAsNoTrackingAsync(payment.PaymentMethodId, cancellationToken);
            paymentDtos.Add(new PaymentDto
            {
                Id = payment.Id,
                InvoiceId = payment.InvoiceId,
                PaymentMethodId = payment.PaymentMethodId,
                PaymentMethodName = method?.Name ?? "N/A",
                Code = payment.Code,
                Amount = payment.Amount,
                Status = payment.Status,
                PaymentDate = payment.PaymentDate
            });
        }

        // 5. Kết hợp tạo DTO trả về
        return new InvoiceDto
        {
            Id = invoice.Id,
            SalesOrderId = invoice.SalesOrderId ?? Guid.Empty,
            SalesOrderCode = order?.Code ?? string.Empty,
            Code = invoice.Code,
            Status = invoice.Status,
            Amount = invoice.Amount,
            CreatedAt = invoice.CreatedAt,
            Items = itemDtos,
            Payments = paymentDtos
        };
    }

    /// <summary>
    /// Lấy hóa đơn được xuất từ một mã Đơn hàng bán lẻ cụ thể.
    /// </summary>
    public async Task<InvoiceDto> Handle(GetInvoiceBySalesOrderIdQuery request, CancellationToken cancellationToken)
    {
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();
        var invoices = await invoiceRepo.FindAsNoTrackingAsync(x => x.SalesOrderId == request.SalesOrderId, cancellationToken);
        var invoice = invoices.FirstOrDefault();
        if (invoice == null)
        {
            throw new NotFoundException("Hóa đơn của Đơn hàng", request.SalesOrderId);
        }
        return await Handle(new GetInvoiceByIdQuery(invoice.Id), cancellationToken);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách hóa đơn trong hệ thống.
    /// </summary>
    public async Task<IEnumerable<InvoiceDto>> Handle(GetAllInvoicesQuery request, CancellationToken cancellationToken)
    {
        var invoiceRepo = _unitOfWork.Repository<InvoiceEntity>();
        var query = invoiceRepo.GetQueryableAsNoTracking();

        var branchFilter = _scopeContext.GetEffectiveBranchFilter();
        if (branchFilter.HasValue)
        {
            query = query.Where(inv => inv.BranchId == branchFilter.Value);
        }

        var invoices = query.ToList();

        var result = new List<InvoiceDto>();
        foreach (var inv in invoices)
        {
            var dto = await Handle(new GetInvoiceByIdQuery(inv.Id), cancellationToken);
            result.Add(dto);
        }

        return result;
    }

    /// <summary>
    /// Lấy toàn bộ danh sách các phương thức thanh toán.
    /// </summary>
    public async Task<IEnumerable<PaymentMethodDto>> Handle(GetAllPaymentMethodsQuery request, CancellationToken cancellationToken)
    {
        var methodRepo = _unitOfWork.Repository<PaymentMethodEntity>();
        var methods = await methodRepo.GetAllAsNoTrackingAsync(cancellationToken);

        return methods.Select(m => new PaymentMethodDto
        {
            Id = m.Id,
            Code = m.Code,
            Name = m.Name,
            IsActive = m.IsActive
        });
    }
}
