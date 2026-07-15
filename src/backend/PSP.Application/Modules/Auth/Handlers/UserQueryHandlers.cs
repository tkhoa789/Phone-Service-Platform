using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Queries;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Application.Modules.Auth.Handlers;

/// <summary>
/// "Nhà bếp" chuyên phụ trách các thao tác ĐỌC dữ liệu (Queries) cho User.
/// Luôn xài kỹ thuật "AsNoTracking" (chỉ nhìn qua không theo dõi) để tối đa tốc độ lấy dữ liệu.
/// </summary>
public class UserQueryHandlers : 
    IRequestHandler<GetUserByIdQuery, UserDto>,
    IRequestHandler<GetAllUsersQuery, IEnumerable<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UserQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy duy nhất 1 User.
    /// </summary>
    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        
        // Gọi thẳng hàm đọc tối ưu (AsNoTracking)
        var user = await userRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        
        if (user == null)
        {
            throw new NotFoundException("Người dùng", request.Id);
        }

        // Chuyển cục Entity thô thành 1 hộp quà DTO (Đã giấu nhẹm trường PasswordHash đi).
        // Nhờ vậy lỡ hacker có chọc vào API này cũng không thể chôm mật khẩu của User.
        return user.Adapt<UserDto>();
    }

    /// <summary>
    /// Lấy nguyên băng danh sách nhân viên.
    /// </summary>
    public async Task<IEnumerable<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        
        IEnumerable<UserEntity> users;
        
        // Tính năng Lọc (Filter): Nếu client có gửi lên tham số BranchId.
        if (request.BranchId.HasValue)
        {
            // Thì ta chỉ "Bới" ra những nhân viên thuộc đúng Chi nhánh đó thôi.
            users = await userRepo.FindAsNoTrackingAsync(x => x.BranchId == request.BranchId.Value, cancellationToken);
        }
        else 
        {
            // Nếu không gửi điều kiện gì, lấy sạch sành sanh toàn bộ công ty.
            users = await userRepo.GetAllAsNoTrackingAsync(cancellationToken);
        }
        
        // Đóng hộp an toàn trước khi trả về mặt tiền.
        return users.Adapt<IEnumerable<UserDto>>();
    }
}
