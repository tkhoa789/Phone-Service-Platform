using System.Text.RegularExpressions;
using FluentValidation;
using PSP.Application.Modules.Warranty.Queries;

namespace PSP.Application.Modules.Warranty.Validators;

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho CheckWarrantyStatusQuery.
/// Đảm bảo tính hợp lệ, an toàn và chống khai thác quét dữ liệu (anti-enumeration / injection).
/// </summary>
public class CheckWarrantyStatusQueryValidator : AbstractValidator<CheckWarrantyStatusQuery>
{
    public CheckWarrantyStatusQueryValidator()
    {
        RuleFor(x => x.Imei)
            .NotEmpty().WithMessage("Mã số IMEI không được để trống.")
            .Must(BeAValidImeiFormat).WithMessage("Mã IMEI không hợp lệ. Độ dài phải từ 14 đến 18 ký tự và chỉ chứa chữ cái, chữ số.");
    }

    private bool BeAValidImeiFormat(string? imei)
    {
        if (string.IsNullOrWhiteSpace(imei))
            return false;

        var clean = imei.Trim().Replace("-", "").Replace(" ", "");
        return clean.Length >= 14 && clean.Length <= 18 && Regex.IsMatch(clean, "^[a-zA-Z0-9]+$");
    }
}
