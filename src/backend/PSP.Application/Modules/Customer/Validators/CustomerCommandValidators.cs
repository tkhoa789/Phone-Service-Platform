using FluentValidation;
using PSP.Application.Modules.Customer.Commands;

namespace PSP.Application.Modules.Customer.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho CreateCustomerCommand.
/// </summary>
public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên khách hàng không được để trống.")
            .MaximumLength(100).WithMessage("Họ và tên khách hàng không vượt quá 100 ký tự.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^[0-9]{9,15}$").WithMessage("Số điện thoại không hợp lệ (chỉ chứa các số từ 9 đến 15 chữ số).")
            .MaximumLength(15).WithMessage("Số điện thoại không được vượt quá 15 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Địa chỉ Email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email không vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ không vượt quá 255 ký tự.");
    }
}

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdateCustomerCommand.
/// </summary>
public class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Khách hàng không được để trống.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên khách hàng không được để trống.")
            .MaximumLength(100).WithMessage("Họ và tên khách hàng không vượt quá 100 ký tự.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^[0-9]{9,15}$").WithMessage("Số điện thoại không hợp lệ (chỉ chứa các số từ 9 đến 15 chữ số).")
            .MaximumLength(15).WithMessage("Số điện thoại không được vượt quá 15 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Địa chỉ Email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email không vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ không vượt quá 255 ký tự.");
    }
}
