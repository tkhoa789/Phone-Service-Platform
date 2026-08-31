using MediatR;
using System;

namespace PSP.Application.Modules.Customer.Commands;

/// <summary>
/// COMMAND tạo mới một khách hàng.
/// Trả về Guid của khách hàng vừa tạo.
/// </summary>
public record CreateCustomerCommand : IRequest<Guid>
{
    public string FullName { get; init; } = string.Empty;
    
    /// <summary>
    /// Số điện thoại dùng làm định danh (BR-301, BR-302)
    /// </summary>
    public string Phone { get; init; } = string.Empty;
    
    public string? Email { get; init; }
    
    public string? Address { get; init; }
}

/// <summary>
/// COMMAND cập nhật thông tin hồ sơ khách hàng.
/// </summary>
public record UpdateCustomerCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    public string FullName { get; init; } = string.Empty;
    
    /// <summary>
    /// Số điện thoại (chặn trùng lặp với khách hàng khác)
    /// </summary>
    public string Phone { get; init; } = string.Empty;
    
    public string? Email { get; init; }
    
    public string? Address { get; init; }
    
    public byte[] RowVersion { get; init; } = Array.Empty<byte>();
}

/// <summary>
/// COMMAND xóa mềm khách hàng.
/// </summary>
public record DeleteCustomerCommand(Guid Id) : IRequest<bool>;
