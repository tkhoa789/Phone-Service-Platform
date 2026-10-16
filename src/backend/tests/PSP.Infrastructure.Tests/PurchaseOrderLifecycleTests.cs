using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.Handlers;
using PSP.Application.Modules.Product.Commands;
using PSP.Application.Modules.Product.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Testcontainers.MsSql;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class PurchaseOrderLifecycleTests : IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();
    
    private Guid _currentUserId = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        await _msSqlContainer.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _msSqlContainer.DisposeAsync();
    }

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_msSqlContainer.GetConnectionString())
            .Options;

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        
        var context = new AppDbContext(options, mockCurrentUserService.Object);
        context.Database.Migrate();
        
        return context;
    }

    private async Task<(AppDbContext Context, PurchaseOrderEntity PO, SupplierEntity Supplier, ProductVariantEntity Variant, WarehouseEntity Warehouse)> SetupTestContextAsync(bool isImeiControlled = true)
    {
        var context = CreateDbContext();
        
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Mobile", Code = isImeiControlled ? "MOBILE" : "ACCESSORY" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Apple", Code = "APPLE" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "iPhone", Code = "IPHONE" };
        
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Main Branch", Code = "MAIN" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "Main WH", BranchId = branch.Id, Code = "WH-MAIN" };
        
        var variant = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "iPhone 15 Pro", SalePrice = 1000, CostPrice = 800, Sku = "IP15P" };
        
        var supplier = new SupplierEntity { Id = Guid.NewGuid(), Name = "Apple Inc", Code = "SUP-APP", DebtAmount = 0 };

        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity { Id = _currentUserId, FullName = "System", Email = "sys@test.com", BranchId = branch.Id };
        
        var po = new PurchaseOrderEntity 
        { 
            Id = Guid.NewGuid(), 
            SupplierId = supplier.Id, 
            WarehouseId = warehouse.Id, 
            Code = "PO-" + Guid.NewGuid().ToString().Substring(0, 6),
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = 1600
        };

        var poItem = new PurchaseOrderItemEntity
        {
            Id = Guid.NewGuid(),
            PurchaseOrderId = po.Id,
            ProductVariantId = variant.Id,
            Quantity = 2,
            UnitPrice = 800
        };

        context.Categories.Add(category);
        context.Brands.Add(brand);
        context.Products.Add(productBase);
        context.Branches.Add(branch);
        context.Warehouses.Add(warehouse);
        context.ProductVariants.Add(variant);
        context.Suppliers.Add(supplier);
        context.Users.Add(user);
        context.PurchaseOrders.Add(po);
        context.PurchaseOrderItems.Add(poItem);

        await context.SaveChangesAsync();

        return (context, po, supplier, variant, warehouse);
    }

    [Fact]
    public async Task CompletePO_Success_AddsInventory_CreatesLedger_And_IncreasesDebt()
    {
        var (setupContext, po, supplier, variant, warehouse) = await SetupTestContextAsync(isImeiControlled: true);
        var uow = new UnitOfWork(setupContext);
        var mockIdempotencyService = new Mock<IIdempotencyService>();
        var handler = new PurchaseOrderCommandHandlers(uow, mockIdempotencyService.Object);

        var imeis = new List<string> { "IMEI-123", "IMEI-456" };
        var command = new CompletePurchaseOrderCommand
        {
            Id = po.Id,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new ProductVariantImeisDto { ProductVariantId = variant.Id, Imeis = imeis }
            },
            RowVersion = po.RowVersion
        };

        var result = await handler.Handle(command, CancellationToken.None);
        result.Should().BeTrue();

        using var assertContext = CreateDbContext();
        var updatedPo = await assertContext.PurchaseOrders.FindAsync(po.Id);
        updatedPo.Status.Should().Be(PurchaseOrderStatus.Received);

        var updatedSupplier = await assertContext.Suppliers.FindAsync(supplier.Id);
        updatedSupplier.DebtAmount.Should().Be(1600);

        var inventory = await assertContext.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == warehouse.Id && i.ProductVariantId == variant.Id);
        inventory.Should().NotBeNull();
        inventory.Quantity.Should().Be(2);

        var ledger = await assertContext.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == po.Id);
        ledger.Should().NotBeNull();
        ledger.Type.Should().Be(InventoryTransactionType.IMPORT);
        ledger.QuantityChange.Should().Be(2);

        var debtTxn = await assertContext.SupplierDebtTransactions.FirstOrDefaultAsync(t => t.SupplierId == supplier.Id);
        debtTxn.Should().NotBeNull();
        debtTxn.TransactionType.Should().Be("INVOICE");
        debtTxn.Amount.Should().Be(1600);

        var imeiEntities = await assertContext.Imeis.Where(i => i.ProductVariantId == variant.Id).ToListAsync();
        imeiEntities.Count.Should().Be(2);
        imeiEntities.Select(i => i.Imei).Should().BeEquivalentTo(imeis);
    }

    [Fact]
    public async Task CompletePO_WithDuplicateImei_RollsBackEverything()
    {
        var (setupContext, po, supplier, variant, warehouse) = await SetupTestContextAsync(isImeiControlled: true);
        
        // Seed an existing IMEI
        var existingImei = new ImeiEntity { Imei = "IMEI-DUPLICATE", ProductVariantId = variant.Id, Status = ImeiStatus.InStock };
        setupContext.Imeis.Add(existingImei);
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockIdempotencyService = new Mock<IIdempotencyService>();
        var handler = new PurchaseOrderCommandHandlers(uow, mockIdempotencyService.Object);

        // Try to complete PO with the duplicate IMEI
        var command = new CompletePurchaseOrderCommand
        {
            Id = po.Id,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new ProductVariantImeisDto { ProductVariantId = variant.Id, Imeis = new List<string> { "IMEI-DUPLICATE", "IMEI-NEW" } }
            },
            RowVersion = po.RowVersion
        };

        await FluentActions.Invoking(() => handler.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*tồn tại trên hệ thống*");

        using var assertContext = CreateDbContext();
        var unchangedPo = await assertContext.PurchaseOrders.FindAsync(po.Id);
        unchangedPo.Status.Should().Be(PurchaseOrderStatus.Draft);

        var unchangedSupplier = await assertContext.Suppliers.FindAsync(supplier.Id);
        unchangedSupplier.DebtAmount.Should().Be(0);

        var ledgerCount = await assertContext.InventoryTransactions.CountAsync(t => t.ReferenceId == po.Id);
        ledgerCount.Should().Be(0);
    }

    [Fact]
    public async Task CompletePO_Concurrent_ThrowsConflict()
    {
        var (setupContext, po, supplier, variant, warehouse) = await SetupTestContextAsync(isImeiControlled: false);
        var initialRowVersion = po.RowVersion;

        var uow1 = new UnitOfWork(setupContext);
        var handler1 = new PurchaseOrderCommandHandlers(uow1, new Mock<IIdempotencyService>().Object);

        var command1 = new CompletePurchaseOrderCommand { Id = po.Id, RowVersion = initialRowVersion };
        await handler1.Handle(command1, CancellationToken.None);

        using var setupContext2 = CreateDbContext();
        var uow2 = new UnitOfWork(setupContext2);
        var handler2 = new PurchaseOrderCommandHandlers(uow2, new Mock<IIdempotencyService>().Object);

        // Concurrent execution with old RowVersion
        var command2 = new CompletePurchaseOrderCommand { Id = po.Id, RowVersion = initialRowVersion };
        
        var exception = await Record.ExceptionAsync(() => handler2.Handle(command2, CancellationToken.None));
        exception.Should().NotBeNull();
        exception.Should().BeOfType<ConflictException>();

        // Verify it was only imported once
        using var assertContext = CreateDbContext();
        var ledgerCount = await assertContext.InventoryTransactions.CountAsync(t => t.ReferenceId == po.Id);
        ledgerCount.Should().Be(1);
    }

    [Fact]
    public async Task PaySupplierDebt_Success_ReducesDebt_CreatesTxn()
    {
        var (setupContext, _, supplier, _, _) = await SetupTestContextAsync();
        supplier.DebtAmount = 5000;
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var handler = new SupplierCommandHandlers(uow, new Mock<IIdempotencyService>().Object);

        var command = new PaySupplierDebtCommand(supplier.Id, 2000, "CASH", "PAY-001", "Testing", supplier.RowVersion);
        var result = await handler.Handle(command, CancellationToken.None);
        result.Should().BeTrue();

        using var assertContext = CreateDbContext();
        var updatedSupplier = await assertContext.Suppliers.FindAsync(supplier.Id);
        updatedSupplier.DebtAmount.Should().Be(3000);

        var tx = await assertContext.SupplierDebtTransactions.FirstOrDefaultAsync(t => t.SupplierId == supplier.Id && t.ReferenceNo == "PAY-001");
        tx.Should().NotBeNull();
        tx.TransactionType.Should().Be("PAYMENT");
        tx.Amount.Should().Be(2000);
    }

    [Fact]
    public async Task PaySupplierDebt_Concurrent_ThrowsConflict()
    {
        var (setupContext, _, supplier, _, _) = await SetupTestContextAsync();
        supplier.DebtAmount = 5000;
        await setupContext.SaveChangesAsync();
        var initialRowVersion = supplier.RowVersion;

        var uow1 = new UnitOfWork(setupContext);
        var handler1 = new SupplierCommandHandlers(uow1, new Mock<IIdempotencyService>().Object);

        var command1 = new PaySupplierDebtCommand(supplier.Id, 2000, "CASH", "PAY-001", "Testing", initialRowVersion);
        await handler1.Handle(command1, CancellationToken.None);

        using var setupContext2 = CreateDbContext();
        var uow2 = new UnitOfWork(setupContext2);
        var handler2 = new SupplierCommandHandlers(uow2, new Mock<IIdempotencyService>().Object);

        // Concurrent execution with old RowVersion
        var command2 = new PaySupplierDebtCommand(supplier.Id, 1000, "CASH", "PAY-002", "Testing", initialRowVersion);
        
        var exception = await Record.ExceptionAsync(() => handler2.Handle(command2, CancellationToken.None));
        exception.Should().NotBeNull();
        exception.Should().BeOfType<ConflictException>();

        using var assertContext = CreateDbContext();
        var finalSupplier = await assertContext.Suppliers.FindAsync(supplier.Id);
        finalSupplier.DebtAmount.Should().Be(3000); // Only first payment went through
    }
}
