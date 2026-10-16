using System;
using System.Collections.Generic;
using System.Linq;

namespace PSP.Domain.Common.Constants;

/// <summary>
/// CANONICAL ROLES FOR PSP PLATFORM (RBAC-01)
/// 
/// Enterprise authorization canonical role definitions.
/// Only these 7 canonical roles are valid across the entire system:
/// - Owner: Chu so huu he thong / Chu tich dieu hanh
/// - Admin: Quan tri vien he thong IT
/// - Manager: Quan ly chi nhanh
/// - Sales: Nhan vien ban hang tai quay (POS) & le tan
/// - Technician: Ky thuat vien sua chua & chan doan
/// - Warranty: Nhan vien bao hanh & doi tra
/// - Inventory: Thu kho & quan ly ton kho/IMEI
/// 
/// Legacy roles (Staff, Receptionist) are strictly deprecated and normalized.
/// </summary>
public static class CanonicalRoles
{
    public const string Owner = "Owner";
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Sales = "Sales";
    public const string Technician = "Technician";
    public const string Warranty = "Warranty";
    public const string Inventory = "Inventory";

    /// <summary>
    /// The immutable list of all 7 canonical roles.
    /// </summary>
    public static readonly IReadOnlyList<string> All = new[]
    {
        Owner,
        Admin,
        Manager,
        Sales,
        Technician,
        Warranty,
        Inventory
    };

    /// <summary>
    /// Validate whether a role string is a canonical role (case-insensitive).
    /// </summary>
    public static bool IsValid(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        return All.Contains(role.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Normalize any role string to its exact canonical case, or map legacy roles:
    /// "Receptionist" -> "Sales"
    /// "Staff" -> null (must be assigned explicitly)
    /// </summary>
    public static string? Normalize(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return null;
        var trimmed = role.Trim();

        // Legacy mappings
        if (string.Equals(trimmed, "Receptionist", StringComparison.OrdinalIgnoreCase))
            return Sales;

        return All.FirstOrDefault(r => string.Equals(r, trimmed, StringComparison.OrdinalIgnoreCase));
    }
}
