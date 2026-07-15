using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Branch.Queries;
using PSP.Application.Modules.Branch.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Application.Modules.Branch.Handlers;

/// <summary>
/// Nơi xử lý riêng biệt các Yêu cầu ĐỌC dữ liệu (Query).
/// CQRS (Command Query Responsibility Segregation) bắt buộc tách việc Đọc và Ghi ra làm 2 class khác nhau.
/// Việc này giúp chia để trị, tối ưu tốc độ đọc cực nhanh vì không vướng bận việc ghi.
/// </summary>
public class BranchQueryHandlers : 
    IRequestHandler<GetBranchByIdQuery, BranchDto>, // Xử lý câu hỏi: Lấy chi nhánh theo ID
    IRequestHandler<GetAllBranchesQuery, IEnumerable<BranchDto>> // Xử lý câu hỏi: Lấy toàn bộ chi nhánh
{
    private readonly IUnitOfWork _unitOfWork;

    public BranchQueryHandlers(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Trả lời cho câu hỏi Lấy 1 chi nhánh.
    /// </summary>
    public async Task<BranchDto> Handle(GetBranchByIdQuery request, CancellationToken cancellationToken)
    {
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // BÍ QUYẾT TỐI ƯU HIỆU NĂNG:
        // Dùng hàm GetByIdAsNoTrackingAsync thay vì GetByIdAsync thông thường.
        // "AsNoTracking" nghĩa là: Lấy dữ liệu ra xem thôi, không cần hệ thống (Entity Framework) phải theo dõi
        // xem tôi có thay đổi gì không. 
        // Việc tắt tính năng "theo dõi" (Tracking) này giúp hàm chạy lẹ hơn gấp 2-3 lần, ít tốn RAM máy chủ.
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        
        if (branch == null)
        {
            throw new NotFoundException("Chi nhánh", request.Id);
        }

        // BranchEntity là cái lấy từ Database (chứa các cột phức tạp).
        // BranchDto là một cái hộp đóng gói đơn giản.
        // Adapt giúp hô biến dữ liệu từ Entity thành Dto để gửi về Web an toàn, không lộ bí mật.
        return branch.Adapt<BranchDto>();
    }

    /// <summary>
    /// Trả lời cho câu hỏi Lấy tất cả chi nhánh.
    /// </summary>
    public async Task<IEnumerable<BranchDto>> Handle(GetAllBranchesQuery request, CancellationToken cancellationToken)
    {
        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        
        // Lấy toàn bộ các dòng trong bảng Chi Nhánh với chế độ AsNoTracking (Siêu nhanh).
        var branches = await branchRepo.GetAllAsNoTrackingAsync(cancellationToken);
        
        // Biến danh sách phức tạp (List of BranchEntity) thành danh sách an toàn (List of BranchDto).
        return branches.Adapt<IEnumerable<BranchDto>>();
    }
}
