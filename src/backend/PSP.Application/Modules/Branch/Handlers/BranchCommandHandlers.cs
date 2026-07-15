using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Branch.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Application.Modules.Branch.Handlers;

/// <summary>
/// Handler (Người xử lý). Nơi đây giống như "Nhà bếp" hoặc "Thợ máy".
/// Controller chỉ là người nhận lệnh, còn Handler mới là nơi chứa não bộ tư duy thực sự.
/// Class này xử lý 3 hành động GHI (Command): Thêm mới, Sửa, Xóa Chi nhánh.
/// </summary>
public class BranchCommandHandlers : 
    IRequestHandler<CreateBranchCommand, Guid>, // Đăng ký khả năng xử lý lệnh Tạo mới, trả về ID (Guid)
    IRequestHandler<UpdateBranchCommand, bool>, // Đăng ký khả năng xử lý lệnh Sửa, trả về Đúng/Sai (bool)
    IRequestHandler<DeleteBranchCommand, bool>  // Đăng ký khả năng xử lý lệnh Xóa
{
    // Cổng kết nối với Cơ sở dữ liệu (Database).
    // Giống như một cái ống nước, giúp ta bơm dữ liệu xuống CSDL hoặc hút dữ liệu lên.
    private readonly IUnitOfWork _unitOfWork;

    // Khi hệ thống chạy, nó sẽ tự động bơm (Inject) ống kết nối Database vào đây.
    public BranchCommandHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Hàm này chạy khi có Lệnh tạo chi nhánh (CreateBranchCommand) gửi tới.
    /// </summary>
    public async Task<Guid> Handle(CreateBranchCommand request, CancellationToken cancellationToken)
    {
        // 1. Mở tủ hồ sơ của Bảng Chi Nhánh (Branch) trong Database
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // 2. Logic Nghiệp vụ: Đi tìm xem có chi nhánh nào trong Database đang xài cái Mã (Code) này chưa?
        // Ký hiệu "x => x.Code == request.Code" có nghĩa là: Lọc những dòng có Code bằng với Code gửi lên.
        var existing = await branchRepo.FindAsync(x => x.Code == request.Code, cancellationToken);
        
        // 3. Nếu tìm thấy (Any() là đúng), nghĩa là bị trùng mã.
        if (existing.Any())
        {
            // Báo lỗi bằng cách ném (throw) ra một ngoại lệ (Exception) tên là Conflict.
            // Hệ thống sẽ tự bắt lỗi này và báo về cho người dùng (Controller không cần lo).
            throw new ConflictException($"Chi nhánh với mã {request.Code} đã tồn tại.");
        }

        // 4. Nếu mã chưa ai xài, tiến hành biến đổi (Adapt) dữ liệu gửi lên thành một Đối tượng (Entity) để lưu vào Database.
        // Mapster giúp copy tên, sđt, địa chỉ... sang BranchEntity mà không cần gán thủ công từng dòng.
        var branch = request.Adapt<BranchEntity>();
        
        // 5. Ra lệnh thêm vào tủ hồ sơ. (Lúc này dữ liệu vẫn chỉ nằm trên RAM/Bộ nhớ tạm).
        await branchRepo.AddAsync(branch, cancellationToken);
        
        // 6. Ra lệnh Lưu chính thức (Save). Lúc này nó mới thực sự chạy lệnh SQL INSERT vào ổ cứng Database.
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 7. Trả về mã ID ngẫu nhiên (Guid) vừa được tạo ra cho chi nhánh này.
        return branch.Id;
    }

    /// <summary>
    /// Hàm này chạy khi có Lệnh cập nhật (Sửa) chi nhánh.
    /// </summary>
    public async Task<bool> Handle(UpdateBranchCommand request, CancellationToken cancellationToken)
    {
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // 1. Tìm chi nhánh cũ trong Database bằng ID của nó.
        var branch = await branchRepo.GetByIdAsync(request.Id, cancellationToken);
        
        // 2. Nếu tìm không thấy (branch == null).
        if (branch == null)
        {
            // Báo lỗi: Không tìm thấy (Not Found).
            throw new NotFoundException("Chi nhánh", request.Id);
        }

        // 3. Copy/Ghi đè dữ liệu mới (request) lên dữ liệu cũ (branch) đang có.
        request.Adapt(branch);
        
        // 4. Đánh dấu là cái hồ sơ này đã bị chỉnh sửa.
        branchRepo.Update(branch);
        
        // 5. Lưu xuống Database (Chạy lệnh SQL UPDATE).
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true; // Trả về báo hiệu đã xong.
    }

    /// <summary>
    /// Hàm này chạy khi có Lệnh Xóa chi nhánh.
    /// </summary>
    public async Task<bool> Handle(DeleteBranchCommand request, CancellationToken cancellationToken)
    {
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // 1. Tìm chi nhánh cần xóa.
        var branch = await branchRepo.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            throw new NotFoundException("Chi nhánh", request.Id);
        }

        // 2. Ra lệnh Xóa. 
        // LƯU Ý BẢO MẬT: Trong dự án này, hàm Remove không thực sự xóa vĩnh viễn khỏi ổ cứng (Tránh mất dữ liệu).
        // Hàm này được thiết kế để tự động đổi cột IsDeleted = true (Đây gọi là Xóa Mềm - Soft Delete).
        branchRepo.Remove(branch);
        
        // 3. Lưu xuống Database.
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
