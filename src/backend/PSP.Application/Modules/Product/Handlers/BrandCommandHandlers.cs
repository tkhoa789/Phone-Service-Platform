using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Product.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Product.Entities;

namespace PSP.Application.Modules.Product.Handlers;

/// <summary>
/// HANDLER (Bộ xử lý logic nghiệp vụ cho các lệnh COMMAND)
/// Lớp này chịu trách nhiệm tiếp nhận và xử lý các yêu cầu thay đổi trạng thái của Thương hiệu:
/// 1. Tạo mới thương hiệu (CreateBrandCommand)
/// 2. Cập nhật thương hiệu (UpdateBrandCommand)
/// 3. Xóa thương hiệu (DeleteBrandCommand)
/// 
/// Kế thừa các interface IRequestHandler của MediatR để liên kết các Command với phương thức xử lý Handle tương ứng.
/// </summary>
public class BrandCommandHandlers :
    IRequestHandler<CreateBrandCommand, Guid>,
    IRequestHandler<UpdateBrandCommand, bool>,
    IRequestHandler<DeleteBrandCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Inject IUnitOfWork thông qua Constructor để làm việc với các Repository và Transaction.
    /// </summary>
    public BrandCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Xử lý tạo mới Thương hiệu.
    /// </summary>
    public async Task<Guid> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        // Lấy repository chuyên biệt cho thực thể BrandEntity từ Unit Of Work
        var brandRepo = _unitOfWork.Repository<BrandEntity>();

        // Kiểm tra xem mã thương hiệu gửi lên đã tồn tại trong database chưa
        var existing = await brandRepo.FindAsync(x => x.Code == request.Code, cancellationToken);
        if (existing.Any())
        {
            // Nếu đã tồn tại thương hiệu cùng mã, quăng lỗi Conflict (xung đột dữ liệu)
            throw new ConflictException($"Thương hiệu với mã {request.Code} đã tồn tại.");
        }

        // Ánh xạ (Map) dữ liệu từ CreateBrandCommand sang BrandEntity bằng thư viện Mapster
        var brand = request.Adapt<BrandEntity>();
        
        // Thêm thực thể mới vào bộ nhớ theo dõi của EF Core
        await brandRepo.AddAsync(brand, cancellationToken);
        
        // Thực thi lưu các thay đổi xuống Database thực tế (Commit Transaction)
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Trả về khóa chính (Guid) của thương hiệu mới được sinh ra
        return brand.Id;
    }

    /// <summary>
    /// Xử lý cập nhật thông tin Thương hiệu.
    /// </summary>
    public async Task<bool> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        
        // Truy vấn thương hiệu cần sửa từ database theo Id
        var brand = await brandRepo.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            // Trả về lỗi NotFound (không tìm thấy) nếu Id không tồn tại
            throw new NotFoundException("Thương hiệu", request.Id);
        }

        // Ánh xạ đè dữ liệu mới từ command vào thực thể cũ đã tải lên từ DB
        request.Adapt(brand);
        
        // Đánh dấu thực thể này đã thay đổi trong EF Core
        brandRepo.Update(brand);
        
        // Lưu thay đổi xuống Database
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Trả về true báo hiệu cập nhật thành công
        return true;
    }

    /// <summary>
    /// Xử lý xóa Thương hiệu (Thực chất là xóa mềm).
    /// </summary>
    public async Task<bool> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brandRepo = _unitOfWork.Repository<BrandEntity>();
        
        // Tìm kiếm thương hiệu cần xóa theo Id
        var brand = await brandRepo.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            throw new NotFoundException("Thương hiệu", request.Id);
        }

        // Gọi hàm xóa. Đối với BaseEntity, hàm Remove của Repo sẽ gán cờ IsDeleted = true thay vì chạy lệnh DELETE trong SQL.
        brandRepo.Remove(brand);
        
        // Lưu thay đổi xuống Database để cập nhật cờ xóa mềm
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

