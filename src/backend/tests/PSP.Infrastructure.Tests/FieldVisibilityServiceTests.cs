using System;
using System.Collections.Generic;
using System.Security.Claims;
using FluentAssertions;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Security;
using PSP.Application.Modules.Customer.DTOs;
using PSP.Application.Modules.Dashboard.DTOs;
using PSP.Application.Modules.Product.DTOs;
using PSP.Domain.Common.Constants;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class FieldVisibilityServiceTests
{
    private (IFieldVisibilityService Service, Mock<ICurrentUserService> MockUser) CreateService(
        string role,
        bool isGlobalAdmin = false)
    {
        var mockUser = new Mock<ICurrentUserService>();
        mockUser.Setup(u => u.UserId).Returns(Guid.NewGuid().ToString());
        mockUser.Setup(u => u.IsGlobalAdmin).Returns(isGlobalAdmin);
        mockUser.Setup(u => u.IsInRole(It.IsAny<string>())).Returns<string>(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));

        var service = new FieldVisibilityService(mockUser.Object);
        return (service, mockUser);
    }

    [Theory]
    [InlineData(CanonicalRoles.Owner, true)]
    [InlineData(CanonicalRoles.Admin, true)]
    [InlineData(CanonicalRoles.Manager, true)]
    [InlineData(CanonicalRoles.Inventory, true)]
    [InlineData(CanonicalRoles.Sales, false)]
    [InlineData(CanonicalRoles.Technician, false)]
    [InlineData(CanonicalRoles.Warranty, false)]
    public void CanViewCostPrice_EnforcesCorrectRoleVisibility(string role, bool expected)
    {
        var (service, _) = CreateService(role);
        service.CanViewCostPrice().Should().Be(expected);
    }

    [Fact]
    public void CanViewProfit_AllowsOwnerAndAdminWithRevenueView_MasksForManager()
    {
        var (ownerService, _) = CreateService(CanonicalRoles.Owner);
        ownerService.CanViewProfit().Should().BeTrue();

        var (adminService, _) = CreateService(CanonicalRoles.Admin);
        adminService.CanViewProfit().Should().BeTrue();

        // Manager has dashboard access but NOT Revenue.VIEW
        var (managerService, _) = CreateService(CanonicalRoles.Manager);
        managerService.CanViewProfit().Should().BeFalse();

        var (salesService, _) = CreateService(CanonicalRoles.Sales);
        salesService.CanViewProfit().Should().BeFalse();
    }

    [Theory]
    [InlineData(CanonicalRoles.Owner, true)]
    [InlineData(CanonicalRoles.Admin, true)]
    [InlineData(CanonicalRoles.Manager, true)]
    [InlineData(CanonicalRoles.Inventory, false)]
    [InlineData(CanonicalRoles.Sales, false)]
    [InlineData(CanonicalRoles.Technician, false)]
    [InlineData(CanonicalRoles.Warranty, false)]
    public void CanViewSupplierFinancials_MasksDebtForInventoryAndOthers(string role, bool expected)
    {
        var (service, _) = CreateService(role);
        service.CanViewSupplierFinancials().Should().Be(expected);
    }

    [Theory]
    [InlineData(CanonicalRoles.Owner, true)]
    [InlineData(CanonicalRoles.Admin, true)]
    [InlineData(CanonicalRoles.Manager, true)]
    [InlineData(CanonicalRoles.Sales, true)]
    [InlineData(CanonicalRoles.Technician, false)]
    [InlineData(CanonicalRoles.Warranty, false)]
    [InlineData(CanonicalRoles.Inventory, false)]
    public void CanViewCustomerFinancials_MasksTotalSpentForTechAndWarranty(string role, bool expected)
    {
        var (service, _) = CreateService(role);
        service.CanViewCustomerFinancials().Should().Be(expected);
    }

    [Fact]
    public void MaskProductVariant_MasksCostPriceForSales_PreservesForInventory()
    {
        var (salesService, _) = CreateService(CanonicalRoles.Sales);
        var variant = new ProductVariantDto { Id = Guid.NewGuid(), Name = "Screen OLED", CostPrice = 500000m, SalePrice = 800000m };

        salesService.MaskProductVariant(variant);
        variant.CostPrice.Should().BeNull();
        variant.SalePrice.Should().Be(800000m);

        var (invService, _) = CreateService(CanonicalRoles.Inventory);
        var variant2 = new ProductVariantDto { Id = Guid.NewGuid(), Name = "Screen OLED", CostPrice = 500000m, SalePrice = 800000m };

        invService.MaskProductVariant(variant2);
        variant2.CostPrice.Should().Be(500000m);
    }

    [Fact]
    public void MaskSupplier_MasksDebtAmountForInventory_PreservesForManager()
    {
        var (invService, _) = CreateService(CanonicalRoles.Inventory);
        var supplier = new SupplierDto { Id = Guid.NewGuid(), Name = "Linh Kien Saigon", DebtAmount = 15000000m };

        invService.MaskSupplier(supplier);
        supplier.DebtAmount.Should().BeNull();

        var (mgrService, _) = CreateService(CanonicalRoles.Manager);
        var supplier2 = new SupplierDto { Id = Guid.NewGuid(), Name = "Linh Kien Saigon", DebtAmount = 15000000m };

        mgrService.MaskSupplier(supplier2);
        supplier2.DebtAmount.Should().Be(15000000m);
    }

    [Fact]
    public void MaskCustomer_MasksTotalSpentForTechnician_PreservesForSales()
    {
        var (techService, _) = CreateService(CanonicalRoles.Technician);
        var customer = new CustomerDto { Id = Guid.NewGuid(), FullName = "Nguyen Van A", TotalSpent = 2500000m };

        techService.MaskCustomer(customer);
        customer.TotalSpent.Should().BeNull();

        var (salesService, _) = CreateService(CanonicalRoles.Sales);
        var customer2 = new CustomerDto { Id = Guid.NewGuid(), FullName = "Nguyen Van A", TotalSpent = 2500000m };

        salesService.MaskCustomer(customer2);
        customer2.TotalSpent.Should().Be(2500000m);
    }

    [Fact]
    public void MaskDashboard_MasksTotalProfitForManager_PreservesForOwner()
    {
        var (mgrService, _) = CreateService(CanonicalRoles.Manager);
        var dashboard = new ManagerDashboardDto { TotalRevenue = 100000000m, TotalProfit = 35000000m, UnitsSold = 45 };

        mgrService.MaskDashboard(dashboard);
        dashboard.TotalProfit.Should().BeNull();
        dashboard.TotalRevenue.Should().Be(100000000m);

        var (ownerService, _) = CreateService(CanonicalRoles.Owner);
        var dashboard2 = new ManagerDashboardDto { TotalRevenue = 100000000m, TotalProfit = 35000000m, UnitsSold = 45 };

        ownerService.MaskDashboard(dashboard2);
        dashboard2.TotalProfit.Should().Be(35000000m);
    }

    [Fact]
    public void NullHandling_DoesNotThrow()
    {
        var (service, _) = CreateService(CanonicalRoles.Sales);
        Action act1 = () => service.MaskProduct(null);
        act1.Should().NotThrow();
        Action act2 = () => service.MaskProductVariant(null);
        act2.Should().NotThrow();
        Action act3 = () => service.MaskSupplier(null);
        act3.Should().NotThrow();
        Action act4 = () => service.MaskCustomer(null);
        act4.Should().NotThrow();
        Action act5 = () => service.MaskDashboard(null);
        act5.Should().NotThrow();
        Action act6 = () => service.MaskProducts(null);
        act6.Should().NotThrow();
        Action act7 = () => service.MaskProductVariants(null);
        act7.Should().NotThrow();
        Action act8 = () => service.MaskSuppliers(null);
        act8.Should().NotThrow();
        Action act9 = () => service.MaskCustomers(null);
        act9.Should().NotThrow();
    }
}
