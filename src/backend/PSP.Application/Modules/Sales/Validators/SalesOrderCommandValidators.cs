using FluentValidation;
using PSP.Application.Modules.Sales.Commands;

namespace PSP.Application.Modules.Sales.Validators;

/// <summary>
/// Các trình kiểm tra lỗi định dạng (Validators) cho các yêu cầu liên quan đến đơn hàng.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Đảm bảo dữ liệu gửi lên đúng cấu trúc cơ bản trước khi đưa xuống tầng xử lý nghiệp vụ.
/// </summary>
public class CreateSalesOrderCommandValidator : AbstractValidator<CreateSalesOrderCommand>
{
    public CreateSalesOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Khách hàng mua hàng không được để trống.");

        // BR-705: Mỗi hóa đơn/đơn hàng phải có ít nhất một sản phẩm hoặc dịch vụ
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Đơn hàng phải chứa ít nhất một sản phẩm.");

        // Kiểm tra chi tiết từng sản phẩm trong mảng Items gửi lên
        RuleForEach(x => x.Items).ChildRules(items =>
        {
            items.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("Biến thể sản phẩm trong chi tiết đơn hàng không hợp lệ.");

            items.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng mua của sản phẩm phải lớn hơn 0.");
        });
    }
}

public class UpdateSalesOrderStatusCommandValidator : AbstractValidator<UpdateSalesOrderStatusCommand>
{
    public UpdateSalesOrderStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id đơn hàng không hợp lệ.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái đơn hàng mới không hợp lệ.");
    }
}
