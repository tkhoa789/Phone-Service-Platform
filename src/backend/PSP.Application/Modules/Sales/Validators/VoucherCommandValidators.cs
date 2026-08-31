using FluentValidation;
using PSP.Application.Modules.Sales.Commands;

namespace PSP.Application.Modules.Sales.Validators;

/// <summary>
/// Trình kiểm tra (Validators) cho các lệnh của Voucher.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Lớp này giúp kiểm duyệt đầu vào cho các yêu cầu tạo mới hoặc chỉnh sửa Voucher.
/// - Đảm bảo mã Voucher viết hoa, giá trị giảm giá hợp lệ trước khi đi tiếp.
/// </summary>
public class CreateVoucherCommandValidator : AbstractValidator<CreateVoucherCommand>
{
    public CreateVoucherCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã Voucher không được để trống.")
            .MaximumLength(30).WithMessage("Mã Voucher tối đa 30 ký tự.")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Mã Voucher chỉ chứa ký tự chữ in hoa, chữ số, gạch nối (-) và gạch dưới (_).");

        RuleFor(x => x.DiscountAmount)
            .GreaterThan(0).WithMessage("Số tiền giảm giá của Voucher phải lớn hơn 0.");

        RuleFor(x => x.MinOrderValue)
            .GreaterThanOrEqualTo(0).WithMessage("Giá trị đơn hàng tối thiểu không được âm.");

        RuleFor(x => x.ExpiryDate)
            .NotEmpty().WithMessage("Hạn sử dụng của Voucher không được để trống.");

        RuleFor(x => x.UsageLimit)
            .GreaterThan(0).WithMessage("Giới hạn số lần sử dụng của Voucher phải lớn hơn 0.");
    }
}

public class UpdateVoucherCommandValidator : AbstractValidator<UpdateVoucherCommand>
{
    public UpdateVoucherCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id Voucher không hợp lệ.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã Voucher không được để trống.")
            .MaximumLength(30).WithMessage("Mã Voucher tối đa 30 ký tự.")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Mã Voucher chỉ chứa ký tự chữ in hoa, chữ số, gạch nối (-) và gạch dưới (_).");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái Voucher không hợp lệ.");

        RuleFor(x => x.DiscountAmount)
            .GreaterThan(0).WithMessage("Số tiền giảm giá của Voucher phải lớn hơn 0.");

        RuleFor(x => x.MinOrderValue)
            .GreaterThanOrEqualTo(0).WithMessage("Giá trị đơn hàng tối thiểu không được âm.");

        RuleFor(x => x.ExpiryDate)
            .NotEmpty().WithMessage("Hạn sử dụng của Voucher không được để trống.");

        RuleFor(x => x.UsageLimit)
            .GreaterThan(0).WithMessage("Giới hạn số lần sử dụng của Voucher phải lớn hơn 0.");
    }
}
