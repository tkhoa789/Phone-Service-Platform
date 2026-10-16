using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.DTOs;
using PSP.Application.Modules.Inventory.Queries;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.Application.Modules.Inventory.Handlers;

/// <summary>
/// HANDLER xử lý các yêu cầu truy vấn thông tin Kho hàng (GetById, GetByBranchId, GetAll).
/// Triển khai độc lập với Entity Framework bằng cách tải dữ liệu liên quan qua IRepository và ghép nối trong bộ nhớ RAM.
/// </summary>
public class WarehouseQueryHandlers :
    IRequestHandler<GetWarehouseByIdQuery, WarehouseDto>,
    IRequestHandler<GetWarehousesByBranchIdQuery, IEnumerable<WarehouseDto>>,
    IRequestHandler<GetWarehousesQuery, IEnumerable<WarehouseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IScopeContextService _scopeContext;

    public WarehouseQueryHandlers(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IScopeContextService scopeContext)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _scopeContext = scopeContext;
    }

    /// <summary>
    /// Xử lý lấy chi tiết kho hàng theo ID.
    /// </summary>
    public async Task<WarehouseDto> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken)
    {
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();

        // 1. Tải thông tin kho hàng không theo dõi (AsNoTracking)
        var warehouse = await warehouseRepo.GetByIdAsNoTrackingAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            throw new NotFoundException("Kho hàng", request.Id);
        }

        // Fail-Closed Branch Isolation Check
        _scopeContext.ValidateBranchAccess(warehouse.BranchId, "kho hàng");

        // 2. Tải thông tin chi nhánh liên kết để lấy Tên chi nhánh
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(warehouse.BranchId, cancellationToken);

        // 3. Ánh xạ sang WarehouseDto và gán tên chi nhánh
        var dto = warehouse.Adapt<WarehouseDto>();
        dto.BranchName = branch?.Name ?? "Không xác định";

        return dto;
    }

    /// <summary>
    /// Xử lý lấy danh sách kho hàng thuộc về một chi nhánh cụ thể.
    /// </summary>
    public async Task<IEnumerable<WarehouseDto>> Handle(GetWarehousesByBranchIdQuery request, CancellationToken cancellationToken)
    {
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();

        // 1. Kiểm tra chi nhánh có tồn tại không
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            throw new NotFoundException("Chi nhánh", request.BranchId);
        }

        // Fail-Closed Branch Isolation Check
        _scopeContext.ValidateBranchAccess(request.BranchId, "chi nhánh");

        // 2. Truy vấn danh sách các kho của chi nhánh đó
        var warehouses = await warehouseRepo.FindAsNoTrackingAsync(w => w.BranchId == request.BranchId, cancellationToken);

        // 3. Ánh xạ danh sách thực thể sang danh sách DTO
        var dtos = warehouses.Select(w =>
        {
            var dto = w.Adapt<WarehouseDto>();
            dto.BranchName = branch.Name; // Mọi kho trong danh sách đều thuộc chi nhánh này
            return dto;
        }).ToList();

        return dtos;
    }

    /// <summary>
    /// Xử lý lấy toàn bộ danh sách kho hàng trong hệ thống.
    /// </summary>
    public async Task<IEnumerable<WarehouseDto>> Handle(GetWarehousesQuery request, CancellationToken cancellationToken)
    {
        var warehouseRepo = _unitOfWork.Repository<WarehouseEntity>();
        var branchRepo = _unitOfWork.Repository<BranchEntity>();

        // 1. Tải toàn bộ kho hàng và toàn bộ chi nhánh lên RAM
        var warehousesQuery = warehouseRepo.GetQueryableAsNoTracking();
        var branchesQuery = branchRepo.GetQueryableAsNoTracking();

        // Fail-Closed Branch Isolation Check
        if (!_scopeContext.IsEnterpriseScope)
        {
            var userBranchId = _scopeContext.GetRequiredBranchId();
            warehousesQuery = warehousesQuery.Where(w => w.BranchId == userBranchId);
            branchesQuery = branchesQuery.Where(b => b.Id == userBranchId);
        }

        var warehouses = warehousesQuery.ToList();
        var branches = branchesQuery.ToList();

        // 2. Tạo Dictionary tra cứu nhanh tên Chi nhánh theo Id để tối ưu hiệu năng (tránh lặp truy vấn N+1)
        var branchMap = branches.ToDictionary(b => b.Id, b => b.Name);

        // 3. Ánh xạ và ghép nối tên Chi nhánh trong RAM
        var dtos = warehouses.Select(w =>
        {
            var dto = w.Adapt<WarehouseDto>();
            if (branchMap.TryGetValue(w.BranchId, out var branchName))
            {
                dto.BranchName = branchName;
            }
            else
            {
                dto.BranchName = "Không xác định";
            }
            return dto;
        }).ToList();

        return dtos;
    }
}
