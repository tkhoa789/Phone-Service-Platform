using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Commands;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Application.Modules.Auth.Handlers;

/// <summary>
/// "Nhà bếp" chuyên phụ trách các thao tác GHI (Tạo mới, Sửa, Xóa) liên quan đến User.
/// </summary>
public class UserCommandHandlers : 
    IRequestHandler<CreateUserCommand, Guid>,
    IRequestHandler<UpdateUserCommand, bool>,
    IRequestHandler<DeleteUserCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IScopeContextService _scopeContext;

    public UserCommandHandlers(
        IUnitOfWork unitOfWork, 
        IPasswordHasher passwordHasher,
        IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Nhận lệnh Tạo mới User.
    /// </summary>
    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(request.BranchId, "người dùng");

        // 1. Lấy ống dẫn (Repository) kết nối tới 2 bảng: User và Branch (Chi nhánh).
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();

        // 2. Logic Kiểm tra chéo (Cross-entity Validation):
        // Bắt buộc nhân viên tạo ra phải thuộc về 1 chi nhánh CÓ THẬT trong hệ thống.
        // Ta thò tay xuống Database tìm thử cái BranchId người dùng gửi lên.
        var branch = await branchRepo.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            // Nếu null (không có), báo lỗi văng thẳng mặt ngay.
            throw new NotFoundException("Chi nhánh", request.BranchId);
        }

        // 3. Logic Độc nhất (Unique):
        // Không thể có 2 nhân viên trùng tên đăng nhập.
        var existingUser = await userRepo.FindAsync(x => x.Username == request.Username, cancellationToken);
        if (existingUser.Any())
        {
            throw new ConflictException($"Tên đăng nhập '{request.Username}' đã tồn tại.");
        }

        // 4. Biến dữ liệu thô thành thực thể Database (Entity).
        var user = request.Adapt<UserEntity>();
        
        // LUÝ Ý: Băm mật khẩu (Hash) an toàn bằng BCrypt (do IPasswordHasher đảm nhiệm).
        user.PasswordHash = _passwordHasher.Hash(request.Password); 

        // 5. Thêm vào hồ sơ và lưu chính thức vào ổ cứng CSDL.
        await userRepo.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Trả lại mã định danh (Id).
        return user.Id;
    }

    /// <summary>
    /// Nhận lệnh Sửa User.
    /// </summary>
    public async Task<bool> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();

        // Đi tìm thằng nhân viên cũ.
        var user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("Người dùng", request.Id);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(user.BranchId, "người dùng");
        _scopeContext.ValidateBranchAccess(request.BranchId, "người dùng");

        // Nếu họ muốn đổi chỗ làm sang chi nhánh khác, phải kiểm tra xem chi nhánh mới có tồn tại không.
        if (user.BranchId != request.BranchId)
        {
            var branch = await branchRepo.GetByIdAsync(request.BranchId, cancellationToken);
            if (branch == null)
            {
                throw new NotFoundException("Chi nhánh mới", request.BranchId);
            }
        }

        // Đắp dữ liệu mới đè lên cái Entity cũ.
        request.Adapt(user);
        
        userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    /// <summary>
    /// Nhận lệnh Xóa User.
    /// </summary>
    public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        
        var user = await userRepo.GetByIdAsync(request.Id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("Người dùng", request.Id);
        }

        // Scope Isolation Check (Fail-Closed)
        _scopeContext.ValidateBranchAccess(user.BranchId, "người dùng");

        // Kỹ thuật Xóa mềm (Soft Delete).
        // Thay vì cầm cục tẩy xóa sạch, ta chỉ lấy bút đỏ gạch chéo đánh dấu là "đã đuổi việc".
        // Lịch sử bán hàng của ông này trong quá khứ vẫn phải được giữ lại.
        userRepo.Remove(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
