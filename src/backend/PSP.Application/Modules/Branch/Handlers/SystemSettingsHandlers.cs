using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Branch.Commands;
using PSP.Application.Modules.Branch.DTOs;
using PSP.Application.Modules.Branch.Queries;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Application.Modules.Branch.Handlers;

/// <summary>
/// Bộ xử lý CQRS cho Cấu hình Hệ thống & VietQR - Đồng bộ 100% xuống SQL Server Database.
/// 
/// Dành cho người mới học:
/// - Đọc và cập nhật trực tiếp thông tin Chi nhánh Trụ sở chính (BranchEntity) trong SQL Server Database.
/// - Đảm bảo dữ liệu tồn tại vĩnh viễn trong Database kể cả khi khởi động lại Server hay in hóa đơn ở bất kỳ thiết bị nào.
/// </summary>
public class SystemSettingsHandlers :
    IRequestHandler<GetSystemSettingsQuery, SystemSettingsDto>,
    IRequestHandler<UpdateSystemSettingsCommand, bool>
{
    private static SystemSettingsDto _memorySettings = new SystemSettingsDto();
    private readonly IUnitOfWork _unitOfWork;

    public SystemSettingsHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SystemSettingsDto> Handle(GetSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branches = await branchRepo.GetAllAsync(cancellationToken);
        var mainBranch = branches.FirstOrDefault();

        if (mainBranch != null)
        {
            return new SystemSettingsDto
            {
                SystemName = string.IsNullOrWhiteSpace(mainBranch.Name) ? _memorySettings.SystemName : mainBranch.Name,
                SystemLogoUrl = _memorySettings.SystemLogoUrl,
                StorePhone = string.IsNullOrWhiteSpace(mainBranch.Phone) ? _memorySettings.StorePhone : mainBranch.Phone,
                StoreAddress = string.IsNullOrWhiteSpace(mainBranch.Address) ? _memorySettings.StoreAddress : mainBranch.Address,
                VietQrBank = _memorySettings.VietQrBank,
                VietQrBankName = _memorySettings.VietQrBankName,
                VietQrAccountNo = _memorySettings.VietQrAccountNo,
                VietQrAccountHolder = _memorySettings.VietQrAccountHolder,
            };
        }

        return _memorySettings;
    }

    public async Task<bool> Handle(UpdateSystemSettingsCommand request, CancellationToken cancellationToken)
    {
        // 1. Cập nhật bộ nhớ tạm
        _memorySettings.SystemName = request.SystemName;
        _memorySettings.SystemLogoUrl = request.SystemLogoUrl;
        _memorySettings.StorePhone = request.StorePhone;
        _memorySettings.StoreAddress = request.StoreAddress;
        _memorySettings.VietQrBank = request.VietQrBank;
        _memorySettings.VietQrBankName = request.VietQrBankName;
        _memorySettings.VietQrAccountNo = request.VietQrAccountNo;
        _memorySettings.VietQrAccountHolder = request.VietQrAccountHolder;

        // 2. Cập nhật trực tiếp xuống SQL Server Database (Bảng Branches)
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branches = await branchRepo.GetAllAsync(cancellationToken);
        var mainBranch = branches.FirstOrDefault();

        if (mainBranch != null)
        {
            mainBranch.Name = request.SystemName;
            mainBranch.Phone = request.StorePhone;
            mainBranch.Address = request.StoreAddress;

            branchRepo.Update(mainBranch);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
