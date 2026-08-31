using PSP.Domain.Common.Entities;

namespace PSP.Domain.Modules.Customer.Entities;

/// <summary>
/// Khách hàng.
/// Tuân thủ BUSINESS_RULE_AI: Một số điện thoại chỉ thuộc một khách hàng duy nhất.
/// Tham chiếu: ERD.md - Section 3.3.
/// </summary>
public class CustomerEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public int RewardPoints { get; set; } = 0;
    public decimal TotalSpent { get; set; } = 0;
    public string MemberTier { get; set; } = "BRONZE";
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
