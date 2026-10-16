using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace PSP.Domain.Common.Constants;

/// <summary>
/// CANONICAL PERMISSIONS FOR PSP PLATFORM (RBAC-02)
/// 
/// Strictly typed constants for all 91 canonical permissions.
/// Format: &lt;Resource&gt;.&lt;ACTION&gt;
/// 
/// Single authoritative source of truth for authorization policies and database seeding.
/// </summary>
public static class Permissions
{
    public static class Dashboard
    {
        public const string View = "Dashboard.VIEW";
        public const string Export = "Dashboard.EXPORT";
    }

    public static class Revenue
    {
        public const string View = "Revenue.VIEW";
        public const string Export = "Revenue.EXPORT";
    }

    public static class POS
    {
        public const string View = "POS.VIEW";
        public const string Create = "POS.CREATE";
    }

    public static class SalesOrder
    {
        public const string View = "SalesOrder.VIEW";
        public const string Create = "SalesOrder.CREATE";
        public const string Update = "SalesOrder.UPDATE";
        public const string Cancel = "SalesOrder.CANCEL";
    }

    public static class Invoice
    {
        public const string View = "Invoice.VIEW";
        public const string Create = "Invoice.CREATE";
        public const string Cancel = "Invoice.CANCEL";
        public const string Export = "Invoice.EXPORT";
    }

    public static class Voucher
    {
        public const string View = "Voucher.VIEW";
        public const string Apply = "Voucher.APPLY";
        public const string Create = "Voucher.CREATE";
        public const string Update = "Voucher.UPDATE";
        public const string Delete = "Voucher.DELETE";
    }

    public static class Repair
    {
        public const string View = "Repair.VIEW";
        public const string Create = "Repair.CREATE";
        public const string Diagnose = "Repair.DIAGNOSE";
        public const string Update = "Repair.UPDATE";
        public const string Complete = "Repair.COMPLETE";
        public const string Cancel = "Repair.CANCEL";
        public const string Deposit = "Repair.DEPOSIT";
        public const string Refund = "Repair.REFUND";
        public const string UpdatePart = "Repair.PART_STATUS";
        public const string ReturnPart = "Repair.PART_RETURN";
        public const string WriteOffPart = "Repair.WRITEOFF";
    }

    public static class Warranty
    {
        public const string View = "Warranty.VIEW";
        public const string Create = "Warranty.CREATE";
        public const string Update = "Warranty.UPDATE";
        public const string Complete = "Warranty.COMPLETE";
        public const string Cancel = "Warranty.CANCEL";
    }

    public static class Customer
    {
        public const string View = "Customer.VIEW";
        public const string Create = "Customer.CREATE";
        public const string Update = "Customer.UPDATE";
        public const string Delete = "Customer.DELETE";
    }

    public static class Product
    {
        public const string View = "Product.VIEW";
        public const string Create = "Product.CREATE";
        public const string Update = "Product.UPDATE";
        public const string Delete = "Product.DELETE";
        public const string Import = "Product.IMPORT";
        public const string Export = "Product.EXPORT";
    }

    public static class Inventory
    {
        public const string View = "Inventory.VIEW";
        public const string Adjust = "Inventory.ADJUST";
        public const string ManageMinimumStock = "Inventory.MANAGE_MINIMUM_STOCK";
    }

    public static class IMEI
    {
        public const string View = "IMEI.VIEW";
        public const string Manage = "IMEI.MANAGE";
    }

    public static class StockTake
    {
        public const string View = "StockTake.VIEW";
        public const string Create = "StockTake.CREATE";
        public const string Start = "StockTake.START";
        public const string Update = "StockTake.UPDATE";
        public const string Submit = "StockTake.SUBMIT";
        public const string Complete = "StockTake.COMPLETE";
        public const string Cancel = "StockTake.CANCEL";
    }

    public static class Supplier
    {
        public const string View = "Supplier.VIEW";
        public const string Create = "Supplier.CREATE";
        public const string Update = "Supplier.UPDATE";
        public const string Delete = "Supplier.DELETE";
        public const string PayDebt = "Supplier.PAY_DEBT";
    }

    public static class PurchaseOrder
    {
        public const string View = "PurchaseOrder.VIEW";
        public const string Create = "PurchaseOrder.CREATE";
        public const string Update = "PurchaseOrder.UPDATE";
        public const string Receive = "PurchaseOrder.RECEIVE";
        public const string Pay = "PurchaseOrder.PAY";
        public const string Cancel = "PurchaseOrder.CANCEL";
    }

    public static class Warehouse
    {
        public const string View = "Warehouse.VIEW";
        public const string Create = "Warehouse.CREATE";
        public const string Update = "Warehouse.UPDATE";
        public const string Delete = "Warehouse.DELETE";
    }

    public static class WarehouseTransfer
    {
        public const string View = "WarehouseTransfer.VIEW";
        public const string Create = "WarehouseTransfer.CREATE";
        public const string Update = "WarehouseTransfer.UPDATE";
        public const string Ship = "WarehouseTransfer.SHIP";
        public const string Receive = "WarehouseTransfer.RECEIVE";
        public const string Cancel = "WarehouseTransfer.CANCEL";
    }

    public static class Branch
    {
        public const string View = "Branch.VIEW";
        public const string Create = "Branch.CREATE";
        public const string Update = "Branch.UPDATE";
        public const string Delete = "Branch.DELETE";
    }

    public static class User
    {
        public const string View = "User.VIEW";
        public const string Create = "User.CREATE";
        public const string Update = "User.UPDATE";
        public const string Delete = "User.DELETE";
        public const string ManageRoles = "User.MANAGE_ROLES";
    }

    public static class Role
    {
        public const string View = "Role.VIEW";
        public const string Manage = "Role.MANAGE";
    }

    public static class SystemSettings
    {
        public const string View = "SystemSettings.VIEW";
        public const string Update = "SystemSettings.UPDATE";
    }

    public static class AuditLog
    {
        public const string View = "AuditLog.VIEW";
        public const string Export = "AuditLog.EXPORT";
    }

    public static class Notification
    {
        public const string View = "Notification.VIEW";
        public const string Send = "Notification.SEND";
    }

    public static class AI
    {
        public const string Chat = "AI.CHAT";
        public const string Analytics = "AI.ANALYTICS";
    }

    /// <summary>
    /// All 91 canonical permissions.
    /// </summary>
    public static readonly IReadOnlyList<string> All = new[]
    {
        Dashboard.View, Dashboard.Export,
        Revenue.View, Revenue.Export,
        POS.View, POS.Create,
        SalesOrder.View, SalesOrder.Create, SalesOrder.Update, SalesOrder.Cancel,
        Invoice.View, Invoice.Create, Invoice.Cancel, Invoice.Export,
        Voucher.View, Voucher.Apply, Voucher.Create, Voucher.Update, Voucher.Delete,
        Repair.View, Repair.Create, Repair.Diagnose, Repair.Update, Repair.Complete, Repair.Cancel,
        Repair.Deposit, Repair.Refund, Repair.UpdatePart, Repair.ReturnPart, Repair.WriteOffPart,
        Warranty.View, Warranty.Create, Warranty.Update, Warranty.Complete, Warranty.Cancel,
        Customer.View, Customer.Create, Customer.Update, Customer.Delete,
        Product.View, Product.Create, Product.Update, Product.Delete, Product.Import, Product.Export,
        Inventory.View, Inventory.Adjust, Inventory.ManageMinimumStock,
        IMEI.View, IMEI.Manage,
        StockTake.View, StockTake.Create, StockTake.Start, StockTake.Update, StockTake.Submit, StockTake.Complete, StockTake.Cancel,
        Supplier.View, Supplier.Create, Supplier.Update, Supplier.Delete, Supplier.PayDebt,
        PurchaseOrder.View, PurchaseOrder.Create, PurchaseOrder.Update, PurchaseOrder.Receive, PurchaseOrder.Pay, PurchaseOrder.Cancel,
        Warehouse.View, Warehouse.Create, Warehouse.Update, Warehouse.Delete,
        WarehouseTransfer.View, WarehouseTransfer.Create, WarehouseTransfer.Update, WarehouseTransfer.Ship, WarehouseTransfer.Receive, WarehouseTransfer.Cancel,
        Branch.View, Branch.Create, Branch.Update, Branch.Delete,
        User.View, User.Create, User.Update, User.Delete, User.ManageRoles,
        Role.View, Role.Manage,
        SystemSettings.View, SystemSettings.Update,
        AuditLog.View, AuditLog.Export,
        Notification.View, Notification.Send,
        AI.Chat, AI.Analytics
    };

    /// <summary>
    /// Returns the canonical list of permissions mapped to a given canonical role.
    /// </summary>
    public static IReadOnlyList<string> GetPermissionsForRole(string roleName)
    {
        if (RoleMappings.TryGetValue(roleName, out var perms))
        {
            return perms;
        }
        return Array.Empty<string>();
    }

    /// <summary>
    /// Canonical Role-Permission Mappings according to RBAC-02 Matrix.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> RoleMappings =
        new ReadOnlyDictionary<string, IReadOnlyList<string>>(new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [CanonicalRoles.Owner] = All,

            [CanonicalRoles.Admin] = All.Where(p => 
                p != Branch.Create && 
                p != Branch.Delete && 
                p != SystemSettings.Update && 
                p != Revenue.Export
            ).ToList(),

            [CanonicalRoles.Manager] = new[]
            {
                Dashboard.View, Dashboard.Export,
                POS.View, POS.Create,
                SalesOrder.View, SalesOrder.Create, SalesOrder.Update, SalesOrder.Cancel,
                Invoice.View, Invoice.Create, Invoice.Cancel, Invoice.Export,
                Voucher.View, Voucher.Apply, Voucher.Create, Voucher.Update, Voucher.Delete,
                Repair.View, Repair.Create, Repair.Diagnose, Repair.Update, Repair.Complete, Repair.Cancel,
                Repair.Deposit, Repair.Refund, Repair.UpdatePart, Repair.ReturnPart, Repair.WriteOffPart,
                Warranty.View, Warranty.Create, Warranty.Update, Warranty.Complete, Warranty.Cancel,
                Customer.View, Customer.Create, Customer.Update, Customer.Delete,
                Product.View, Product.Create, Product.Update, Product.Delete, Product.Import, Product.Export,
                Inventory.View, Inventory.Adjust, Inventory.ManageMinimumStock,
                IMEI.View, IMEI.Manage,
                StockTake.View, StockTake.Create, StockTake.Start, StockTake.Update, StockTake.Submit, StockTake.Complete, StockTake.Cancel,
                Supplier.View, Supplier.Create, Supplier.Update, Supplier.Delete, Supplier.PayDebt,
                PurchaseOrder.View, PurchaseOrder.Create, PurchaseOrder.Update, PurchaseOrder.Receive, PurchaseOrder.Pay, PurchaseOrder.Cancel,
                Warehouse.View, Warehouse.Update,
                WarehouseTransfer.View, WarehouseTransfer.Create, WarehouseTransfer.Update, WarehouseTransfer.Ship, WarehouseTransfer.Receive, WarehouseTransfer.Cancel,
                Branch.View,
                User.View,
                SystemSettings.View,
                Notification.View, Notification.Send,
                AI.Chat, AI.Analytics
            },

            [CanonicalRoles.Sales] = new[]
            {
                Dashboard.View, Dashboard.Export,
                POS.View, POS.Create,
                SalesOrder.View, SalesOrder.Create, SalesOrder.Update, SalesOrder.Cancel,
                Invoice.View, Invoice.Create, Invoice.Cancel, Invoice.Export,
                Voucher.View, Voucher.Apply,
                Repair.View, Repair.Create, Repair.Deposit, Repair.Cancel,
                Warranty.View, Warranty.Create,
                Customer.View, Customer.Create, Customer.Update,
                Product.View,
                Inventory.View,
                Warehouse.View,
                IMEI.View,
                Branch.View,
                Notification.View,
                AI.Chat
            },

            [CanonicalRoles.Technician] = new[]
            {
                Dashboard.View,
                Repair.View, Repair.Create, Repair.Diagnose, Repair.Update, Repair.Complete, Repair.Cancel,
                Repair.Deposit, Repair.UpdatePart, Repair.ReturnPart, Repair.WriteOffPart,
                Warranty.View, Warranty.Create,
                Customer.View, Customer.Create, Customer.Update,
                Product.View,
                Inventory.View,
                Warehouse.View,
                IMEI.View,
                Branch.View,
                Notification.View,
                AI.Chat
            },

            [CanonicalRoles.Warranty] = new[]
            {
                Dashboard.View,
                SalesOrder.View,
                Invoice.View,
                Warranty.View, Warranty.Create, Warranty.Update, Warranty.Complete, Warranty.Cancel,
                Customer.View, Customer.Create, Customer.Update,
                Product.View,
                Inventory.View,
                Warehouse.View,
                IMEI.View,
                Branch.View,
                Notification.View,
                AI.Chat
            },

            [CanonicalRoles.Inventory] = new[]
            {
                Dashboard.View,
                Product.View, Product.Create, Product.Update, Product.Export,
                Inventory.View, Inventory.Adjust, Inventory.ManageMinimumStock,
                IMEI.View, IMEI.Manage,
                StockTake.View, StockTake.Create, StockTake.Start, StockTake.Update, StockTake.Submit, StockTake.Complete, StockTake.Cancel,
                Supplier.View,
                PurchaseOrder.View, PurchaseOrder.Create, PurchaseOrder.Update, PurchaseOrder.Receive, PurchaseOrder.Cancel,
                Warehouse.View,
                WarehouseTransfer.View, WarehouseTransfer.Create, WarehouseTransfer.Update, WarehouseTransfer.Ship, WarehouseTransfer.Receive, WarehouseTransfer.Cancel,
                Customer.View,
                Branch.View,
                Notification.View,
                AI.Chat
            }
        });
}
