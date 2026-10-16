using MediatR;

namespace PSP.Application.Modules.Branch.Commands;

/// <summary>
/// Command cập nhật Cấu hình Thương hiệu & Tài khoản Ngân hàng VietQR (Dành cho Owner / Admin).
/// </summary>
public record UpdateSystemSettingsCommand(
    string SystemName,
    string? SystemLogoUrl,
    string StorePhone,
    string StoreAddress,
    string VietQrBank,
    string VietQrBankName,
    string VietQrAccountNo,
    string VietQrAccountHolder
) : IRequest<bool>;
