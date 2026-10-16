using System.Collections.Generic;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Dashboard.DTOs;
using PSP.Application.Modules.Product.DTOs;

namespace PSP.Application.Common.Interfaces;

/// <summary>
/// Service chịu trách nhiệm thẩm định và áp dụng Field-Level Data Visibility (RBAC-04).
/// Ngăn chặn rò rỉ dữ liệu nhạy cảm: Giá vốn (COGS), Lợi nhuận (P&L), Công nợ nhà cung cấp, PII chi tiêu khách hàng.
/// </summary>
public interface IFieldVisibilityService
{
    bool CanViewCostPrice();
    bool CanViewProfit();
    bool CanViewSupplierFinancials();
    bool CanViewCustomerFinancials();

    void MaskProductVariant(ProductVariantDto? variant);
    void MaskProductVariants(IEnumerable<ProductVariantDto>? variants);
    void MaskProduct(ProductDto? product);
    void MaskProducts(IEnumerable<ProductDto>? products);

    void MaskSupplier(SupplierDto? supplier);
    void MaskSuppliers(IEnumerable<SupplierDto>? suppliers);

    void MaskCustomer(CustomerDto? customer);
    void MaskCustomers(IEnumerable<CustomerDto>? customers);

    void MaskDashboard(ManagerDashboardDto? dashboard);
}
