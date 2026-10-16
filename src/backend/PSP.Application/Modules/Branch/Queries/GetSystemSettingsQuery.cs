using MediatR;
using PSP.Application.Modules.Branch.DTOs;

namespace PSP.Application.Modules.Branch.Queries;

/// <summary>
/// Query lấy thông tin Cấu hình Thương hiệu & Ngân hàng VietQR.
/// </summary>
public record GetSystemSettingsQuery() : IRequest<SystemSettingsDto>;
