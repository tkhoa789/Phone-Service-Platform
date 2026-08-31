using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Customer.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using PSP.Domain.Modules.Repair.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Customer.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu thay đổi dữ liệu của Khách hàng (Create, Update, Delete).
/// </summary>
public class CustomerCommandHandlers :
    IRequestHandler<CreateCustomerCommand, Guid>,
    IRequestHandler<UpdateCustomerCommand, bool>,
    IRequestHandler<DeleteCustomerCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public CustomerCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới một Khách hàng (tự động sinh mã duy nhất).
    /// </summary>
    public async Task<Guid> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();

        // 1. Kiểm tra tính duy nhất của số điện thoại (BR-301, BR-302)
        var existing = await repo.FindAsync(c => c.Phone == request.Phone, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Số điện thoại '{request.Phone}' đã được đăng ký cho khách hàng khác.");
        }

        // 2. Tự động sinh mã khách hàng duy nhất dựa theo mốc thời gian
        var customerCode = "KH-" + DateTime.UtcNow.ToString("yyMMddHHmmss");

        // 3. Khởi tạo thực thể khách hàng mới
        var customer = new CustomerEntity
        {
            Code = customerCode,
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address
        };

        await repo.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin hồ sơ Khách hàng.
    /// </summary>
    public async Task<bool> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();

        // 1. Tìm thông tin khách hàng hiện tại
        var customer = await repo.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.Id);
        }

        // 2. Kiểm tra concurrent updates via RowVersion
        if (request.RowVersion != null && request.RowVersion.Length > 0 && 
            !customer.RowVersion.SequenceEqual(request.RowVersion))
        {
            throw new ConflictException("Thông tin khách hàng đã bị thay đổi bởi một giao dịch khác (ví dụ: cộng điểm thưởng). Vui lòng tải lại trang để xác nhận thông tin mới nhất.");
        }

        // 3. Kiểm tra chặn trùng số điện thoại với khách hàng khác
        var existing = await repo.FindAsync(c => c.Phone == request.Phone && c.Id != request.Id, cancellationToken);
        if (existing.Any())
        {
            throw new ConflictException($"Số điện thoại '{request.Phone}' đã thuộc về khách hàng khác.");
        }

        // 4. Cập nhật các trường thông tin
        customer.FullName = request.FullName;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.Address = request.Address;

        repo.Update(customer);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new ConflictException("Thông tin khách hàng đã bị thay đổi bởi người khác. Vui lòng thử lại.");
        }

        return true;
    }

    /// <summary>
    /// Xử lý xóa mềm khách hàng. Chặn xóa nếu đã phát sinh bất kỳ giao dịch nào (đơn hàng, bảo hành, sửa chữa).
    /// </summary>
    public async Task<bool> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<CustomerEntity>();

        // 1. Tìm thông tin khách hàng
        var customer = await repo.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", request.Id);
        }

        // 2. Ràng buộc nghiệp vụ: Chặn xóa nếu có đơn bán hàng phát sinh (SalesOrders)
        var salesOrders = await _unitOfWork.Repository<SalesOrderEntity>().FindAsync(o => o.CustomerId == request.Id, cancellationToken);
        if (salesOrders.Any())
        {
            throw new ConflictException("Không thể xóa khách hàng đã phát sinh đơn mua hàng trong hệ thống.");
        }

        // 3. Ràng buộc nghiệp vụ: Chặn xóa nếu có phiếu bảo hành liên kết (WarrantyTickets)
        var warrantyTickets = await _unitOfWork.Repository<WarrantyTicketEntity>().FindAsync(w => w.CustomerId == request.Id, cancellationToken);
        if (warrantyTickets.Any())
        {
            throw new ConflictException("Không thể xóa khách hàng đang có thông tin phiếu bảo hành liên kết.");
        }

        // 4. Ràng buộc nghiệp vụ: Chặn xóa nếu có phiếu sửa chữa liên kết (RepairTickets)
        var repairTickets = await _unitOfWork.Repository<RepairTicketEntity>().FindAsync(r => r.CustomerId == request.Id, cancellationToken);
        if (repairTickets.Any())
        {
            throw new ConflictException("Không thể xóa khách hàng đang có thông tin phiếu sửa chữa dịch vụ liên kết.");
        }

        // 5. Thực hiện xóa mềm
        repo.Remove(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
