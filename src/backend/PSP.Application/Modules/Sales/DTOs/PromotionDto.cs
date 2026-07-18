using System;

namespace PSP.Application.Modules.Sales.DTOs;

/// <summary>
/// DTO (Data Transfer Object) cho Chương trình khuyến mãi.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - DTO là một lớp trung chuyển dữ liệu dạng phẳng, chỉ chứa thuộc tính mà không chứa bất kỳ logic nghiệp vụ nào.
/// - Khi trả dữ liệu từ Database về cho Frontend (qua Web API), ta không trả trực tiếp đối tượng thực thể (Entity) để bảo mật 
///   và tránh lỗi vòng lặp tham chiếu (Circular Reference). Thay vào đó, ta đóng gói dữ liệu vào DTO này.
/// </summary>
public record PromotionDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    
    // Loại chiết khấu: "PERCENTAGE" (giảm theo % ví dụ 10%) hoặc "DIRECT_VALUE" (giảm thẳng tiền ví dụ 50,000 VND)
    public string Type { get; init; } = string.Empty;
    
    // Giá trị giảm giá cụ thể tương ứng với loại
    public decimal Value { get; init; }
    
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
