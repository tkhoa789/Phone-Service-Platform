using FluentValidation;
using PSP.Application.Modules.Sales.Commands;

namespace PSP.Application.Modules.Sales.Validators;

public class CreateInvoiceCommandValidator : AbstractValidator<CreateInvoiceCommand>
{
    public CreateInvoiceCommandValidator()
    {
        RuleFor(x => x.SalesOrderId)
            .NotEmpty().WithMessage("Mã đơn hàng liên kết không được để trống.");
    }
}

public class CreatePaymentCommandValidator : AbstractValidator<CreatePaymentCommand>
{
    public CreatePaymentCommandValidator()
    {
        RuleFor(x => x.InvoiceId)
            .NotEmpty().WithMessage("Mã hóa đơn thanh toán không được để trống.");

        RuleFor(x => x.PaymentMethodId)
            .NotEmpty().WithMessage("Phương thức thanh toán không được để trống.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã giao dịch đối soát ngân hàng/tiền mặt không được để trống.")
            .MaximumLength(100).WithMessage("Mã giao dịch không được dài quá 100 ký tự.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Số tiền thanh toán phải lớn hơn 0.");
    }
}
