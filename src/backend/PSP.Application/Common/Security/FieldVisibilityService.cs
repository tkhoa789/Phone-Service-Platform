using System.Collections.Generic;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Dashboard.DTOs;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Constants;

namespace PSP.Application.Common.Security;

public class FieldVisibilityService : IFieldVisibilityService
{
    private readonly ICurrentUserService? _currentUserService;

    public FieldVisibilityService(ICurrentUserService? currentUserService = null)
    {
        _currentUserService = currentUserService;
    }

    public bool CanViewCostPrice()
    {
        if (_currentUserService == null) return false;

        // Enterprise & Store Management & Supply Chain Inventory can view Cost Price
        return _currentUserService.IsInRole(CanonicalRoles.Owner) ||
               _currentUserService.IsInRole(CanonicalRoles.Admin) ||
               _currentUserService.IsInRole(CanonicalRoles.Manager) ||
               _currentUserService.IsInRole(CanonicalRoles.Inventory);
    }

    public bool CanViewProfit()
    {
        if (_currentUserService == null) return false;

        // Only roles with explicit Revenue.VIEW / Corporate financial governance can view TotalProfit
        return _currentUserService.IsInRole(CanonicalRoles.Owner) ||
               _currentUserService.IsInRole(CanonicalRoles.Admin);
    }

    public bool CanViewSupplierFinancials()
    {
        if (_currentUserService == null) return false;

        // Only roles with Supplier.PAY_DEBT / Treasury management can view DebtAmount
        return _currentUserService.IsInRole(CanonicalRoles.Owner) ||
               _currentUserService.IsInRole(CanonicalRoles.Admin) ||
               _currentUserService.IsInRole(CanonicalRoles.Manager);
    }

    public bool CanViewCustomerFinancials()
    {
        if (_currentUserService == null) return false;

        // Roles interacting with commercial sales/loyalty programs can view TotalSpent
        return _currentUserService.IsInRole(CanonicalRoles.Owner) ||
               _currentUserService.IsInRole(CanonicalRoles.Admin) ||
               _currentUserService.IsInRole(CanonicalRoles.Manager) ||
               _currentUserService.IsInRole(CanonicalRoles.Sales);
    }

    public void MaskProductVariant(ProductVariantDto? variant)
    {
        if (variant == null) return;
        if (!CanViewCostPrice())
        {
            variant.CostPrice = null;
        }
    }

    public void MaskProductVariants(IEnumerable<ProductVariantDto>? variants)
    {
        if (variants == null) return;
        if (!CanViewCostPrice())
        {
            foreach (var v in variants)
            {
                v.CostPrice = null;
            }
        }
    }

    public void MaskProduct(ProductDto? product)
    {
        if (product == null) return;
        MaskProductVariants(product.Variants);
    }

    public void MaskProducts(IEnumerable<ProductDto>? products)
    {
        if (products == null) return;
        foreach (var p in products)
        {
            MaskProduct(p);
        }
    }

    public void MaskSupplier(SupplierDto? supplier)
    {
        if (supplier == null) return;
        if (!CanViewSupplierFinancials())
        {
            supplier.DebtAmount = null;
        }
    }

    public void MaskSuppliers(IEnumerable<SupplierDto>? suppliers)
    {
        if (suppliers == null) return;
        if (!CanViewSupplierFinancials())
        {
            foreach (var s in suppliers)
            {
                s.DebtAmount = null;
            }
        }
    }

    public void MaskCustomer(CustomerDto? customer)
    {
        if (customer == null) return;
        if (!CanViewCustomerFinancials())
        {
            customer.TotalSpent = null;
        }
    }

    public void MaskCustomers(IEnumerable<CustomerDto>? customers)
    {
        if (customers == null) return;
        if (!CanViewCustomerFinancials())
        {
            foreach (var c in customers)
            {
                c.TotalSpent = null;
            }
        }
    }

    public void MaskDashboard(ManagerDashboardDto? dashboard)
    {
        if (dashboard == null) return;
        if (!CanViewProfit())
        {
            dashboard.TotalProfit = null;
        }
    }
}
