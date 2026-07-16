using System;

namespace PSP.Application.Modules.Customer.DTOs;

/// <summary>
/// DTO chứa thông tin Hồ sơ khách hàng (Customer Profile).
/// </summary>
public class CustomerDto
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Mã khách hàng duy nhất (Ví dụ: KH-2607161200)
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Họ và tên khách hàng
    /// </summary>
    public string FullName { get; set; } = string.Empty;
    
    /// <summary>
    /// Số điện thoại (dùng làm định danh duy nhất)
    /// </summary>
    public string Phone { get; set; } = string.Empty;
    
    public string? Email { get; set; }
    
    public string? Address { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
