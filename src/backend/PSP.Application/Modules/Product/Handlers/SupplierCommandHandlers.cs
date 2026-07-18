using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Inventory.Entities; // Chứa thực thể PurchaseOrderEntity (phiếu nhập hàng) để kiểm tra khóa ngoại trước khi xóa

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho các lệnh Command của phân hệ Nhà cung cấp).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Đây là nơi hội tụ toàn bộ logic nghiệp vụ (business logic) thực tế của hệ thống.
/// - Lớp này triển khai 3 Interface "IRequestHandler<Command, Output>" tương ứng cho 3 hành động: Thêm, Sửa, Xóa.
/// - Nhờ MediatR, khi Controller gọi "Mediator.Send(command)", MediatR sẽ tự động tìm đúng Handler này để chạy phương thức "Handle".
/// </summary>
public class SupplierCommandHandlers :
    IRequestHandler<CreateSupplierCommand, Guid>,
    IRequestHandler<UpdateSupplierCommand, bool>,
    IRequestHandler<DeleteSupplierCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Hàm khởi tạo (Constructor).
    /// Sử dụng kỹ thuật Dependency Injection để yêu cầu hệ thống cung cấp đối tượng "IUnitOfWork".
    /// IUnitOfWork giúp ta quản lý tất cả các bảng (Repository) trong cùng một phiên làm việc (Transaction) duy nhất.
    /// </summary>
    public SupplierCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Logic xử lý THÊM MỚI Nhà cung cấp.
    /// </summary>
    public async Task<Guid> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        // 1. Lấy repository tương ứng của thực thể SupplierEntity thông qua UnitOfWork
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        // 2. [LUẬT NGHIỆP VỤ]: Kiểm tra xem mã nhà cung cấp (Code) gửi lên đã tồn tại trong DB chưa (kể cả đã xóa mềm).
        var existing = await supplierRepo.FindFirstIgnoreQueryFiltersAsync(x => x.Code == request.Code, cancellationToken);
        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                request.Adapt(existing);
                supplierRepo.Update(existing);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return existing.Id;
            }
            throw new ConflictException($"Nhà cung cấp với mã {request.Code} đã tồn tại.");
        }

        // 3. Ánh xạ dữ liệu: Dùng Mapster để copy toàn bộ giá trị có tên trùng nhau từ Command (CreateSupplierCommand) sang Entity (SupplierEntity).
        // Giúp ta không phải viết code gán tay nhàm chán: supplier.Code = request.Code; supplier.Name = request.Name; ...
        var supplier = request.Adapt<SupplierEntity>();

        // 4. Đưa thực thể mới vào trạng thái theo dõi (tracking) của EF Core
        await supplierRepo.AddAsync(supplier, cancellationToken);
        
        // 5. Lưu tất cả thay đổi xuống Database vật lý. Lúc này SQL INSERT thực tế mới được thực hiện.
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Trả về Id tự động sinh (Guid) của nhà cung cấp vừa tạo
        return supplier.Id;
    }

    /// <summary>
    /// Logic xử lý CẬP NHẬT (SỬA) thông tin Nhà cung cấp.
    /// </summary>
    public async Task<bool> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        // 1. Kiểm tra nhà cung cấp cần sửa có tồn tại trong hệ thống không
        var supplier = await supplierRepo.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            // Quăng lỗi NotFoundException (lỗi không tìm thấy dữ liệu - trả về HTTP 404)
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        // 2. Ánh xạ đè thông tin mới từ request vào thực thể cũ đã tải lên từ DB.
        // (Lưu ý: Mã Code của nhà cung cấp không có trong UpdateSupplierCommand nên sẽ được bảo toàn không đổi).
        request.Adapt(supplier);

        // 3. Đánh dấu thực thể đã bị thay đổi để EF Core cập nhật lệnh UPDATE
        supplierRepo.Update(supplier);
        
        // 4. Lưu thay đổi xuống Database
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Logic xử lý XÓA Nhà cung cấp (Xóa mềm).
    /// </summary>
    public async Task<bool> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplierRepo = _unitOfWork.Repository<SupplierEntity>();

        // 1. Tìm nhà cung cấp cần xóa
        var supplier = await supplierRepo.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            throw new NotFoundException("Nhà cung cấp", request.Id);
        }

        // 2. [RÀNG BUỘC NGHIỆP VỤ BẢO TOÀN DỮ LIỆU]:
        // Không được phép xóa nhà cung cấp nếu họ đã có bất kỳ phiếu nhập hàng (PurchaseOrder) nào trong DB.
        // Vì nếu xóa sẽ làm hỏng tính toàn vẹn lịch sử nhập kho của chuỗi cửa hàng.
        var purchaseOrderRepo = _unitOfWork.Repository<PurchaseOrderEntity>();
        var hasOrders = (await purchaseOrderRepo.FindAsync(x => x.SupplierId == request.Id, cancellationToken)).Any();
        if (hasOrders)
        {
            // Quăng lỗi BadRequestException (lỗi yêu cầu không hợp lệ - trả về HTTP 400)
            throw new BadRequestException("Không thể xóa nhà cung cấp này vì đã có phiếu nhập hàng liên kết.");
        }

        // 3. Thực hiện xóa mềm (Bên dưới Repo sẽ set IsDeleted = true và DeletedAt = DateTime.UtcNow)
        supplierRepo.Remove(supplier);
        
        // 4. Lưu thay đổi xuống Database
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

