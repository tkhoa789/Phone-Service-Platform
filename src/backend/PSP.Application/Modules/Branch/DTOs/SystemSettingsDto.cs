namespace PSP.Application.Modules.Branch.DTOs;

/// <summary>
/// DTO chứa thông tin Cấu hình Thương hiệu Hệ thống & Tài khoản Ngân hàng VietQR.
/// Dành cho người mới học và trình độ dưới junior:
/// - Chứa thông tin tên thương hiệu, hotline, địa chỉ trụ sở và VietQR để hiển thị ở POS.
/// </summary>
public class SystemSettingsDto
{
    public string SystemName { get; set; } = "Phone Service Platform (PSP)";
    public string? SystemLogoUrl { get; set; }
    public string StorePhone { get; set; } = "0901 234 567";
    public string StoreAddress { get; set; } = "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh";
    public string VietQrBank { get; set; } = "970422"; // MBBank
    public string VietQrBankName { get; set; } = "MBBank (NHTM CP Quân Đội)";
    public string VietQrAccountNo { get; set; } = "038921104";
    public string VietQrAccountHolder { get; set; } = "CONG TY PHONG SERVICE PLATFORM";
}
