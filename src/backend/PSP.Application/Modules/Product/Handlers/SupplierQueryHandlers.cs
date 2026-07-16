using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Queries;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic truy vấn của Nhà cung cấp).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Khác với Command Handler làm thay đổi dữ liệu, Query Handler hoàn toàn chỉ đọc (Read-only).
/// - Ta triển khai interface IRequestHandler tương ứng với các Query để lấy dữ liệu nhà cung cấp lên từ Database.
/// - Ở đây, ta sử dụng các phương thức có hậu tố "AsNoTracking" để báo cho EF Core không cần tốn dung lượng bộ nhớ theo dõi các đối tượng này, giúp truy vấn đọc chạy nhanh hơn đáng kể.
/// </summary>
public class SupplierQueryHandlers :
    IRequestHandler<GetSupplierByIdQuery, SupplierDto>,
    IRequestHandler<GetAllSuppliersQuery, IEnumerable<SupplierDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Constructor nhận vào IUnitOfWork để truy cập các bảng dữ liệu.
    /// </summary>
    public SupplierQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý lấy thông tin chi tiết một Nhà cung cấp theo khóa chính Id.
    /// </summary>
    public async Task<SupplierDto> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        
        // 1. Truy vấn dữ liệu không lưu vết (AsNoTracking) từ DB
        var supplier = await supplierRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            // Trả về lỗi 404 Not Found nếu không có bản ghi nào trùng ID gửi lên
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        // 2. Chuyển đổi thực thể Entity trong cơ sở dữ liệu sang SupplierDto để gửi về Client
        return supplier.Adapt<SupplierDto>();
    }

    /// <summary>
    /// Xử lý lấy toàn bộ danh sách các Nhà cung cấp chưa bị xóa mềm.
    /// </summary>
    public async Task<IEnumerable<SupplierDto>> Handle(GetAllSuppliersQuery request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();
        
        // 1. Lấy tất cả nhà cung cấp đang hoạt động
        var suppliers = await supplierRepo.GetAllAsNoTrackingAsync(cancellationToken);
        
        // 2. Ánh xạ toàn bộ danh sách sang danh sách DTO và trả về
        return suppliers.Adapt<IEnumerable<SupplierDto>>();
    }
}

