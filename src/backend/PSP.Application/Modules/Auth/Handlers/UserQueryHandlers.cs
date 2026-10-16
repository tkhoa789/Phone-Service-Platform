using System.Collections.Generic;
using System.Linq;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Queries;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;

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
    private readonly IScopeContextService _scopeContext;

    public UserQueryHandlers(IUnitOfWork unitOfWork, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Lấy duy nhất 1 User.
    /// </summary>
    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // Gọi thẳng hàm đọc tối ưu (AsNoTracking) kèm nạp Roles
        var user = await userRepo.GetQueryableAsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        
        if (user == null)
        {
            throw new NotFoundException("Người dùng", request.Id);
        }

        // Scope Isolation Check (Fail-Closed)
        if (!_scopeContext.IsEnterpriseScope)
        {
            _scopeContext.ValidateBranchAccess(user.BranchId, "người dùng");
        }

        var branch = await branchRepo.GetByIdAsNoTrackingAsync(user.BranchId, cancellationToken);

        // Chuyển cục Entity thô thành 1 hộp quà DTO và điền tên chi nhánh thực tế cùng roles
        var dto = user.Adapt<UserDto>();
        return dto with
        {
            BranchName = branch?.Name ?? string.Empty,
            BranchAddress = branch?.Address ?? string.Empty,
            BranchPhone = branch?.Phone ?? string.Empty,
            Roles = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string>()
        };
    }

    /// <summary>
    /// Lấy nguyên băng danh sách nhân viên.
    /// </summary>
    public async Task<IEnumerable<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branchFilter = _scopeContext.GetEffectiveBranchFilter(request.BranchId);
        
        IQueryable<UserEntity> query = userRepo.GetQueryableAsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role);
        
        // Tính năng Lọc (Filter): Nếu client có gửi lên tham số BranchId hoặc user bị giới hạn bởi scope chi nhánh
        if (branchFilter.HasValue)
        {
            query = query.Where(x => x.BranchId == branchFilter.Value);
        }

        var users = await query.ToListAsync(cancellationToken);
        
        var branches = await branchRepo.GetAllAsNoTrackingAsync(cancellationToken);
        var branchMap = branches.ToDictionary(b => b.Id, b => (Name: b.Name, Address: b.Address, Phone: b.Phone));

        // Đóng hộp an toàn và map BranchName chuẩn xác từ bảng Branches cùng danh sách Roles
        return users.Select(u =>
        {
            var dto = u.Adapt<UserDto>();
            var bInfo = branchMap.TryGetValue(u.BranchId, out var info) ? info : (Name: string.Empty, Address: string.Empty, Phone: string.Empty);
            return dto with
            {
                BranchName = bInfo.Name,
                BranchAddress = bInfo.Address,
                BranchPhone = bInfo.Phone,
                Roles = u.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string>()
            };
        }).ToList();
    }
}
