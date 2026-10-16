using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Infrastructure.Data;
using Testcontainers.MsSql;
using PSP.Application.Common.Interfaces;
using Moq;
using Xunit;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Infrastructure.Data.Repositories;
using System.Collections.Generic;

namespace PSP.Infrastructure.Tests;

public class SalesLifecycleTests : IAsyncLifetime
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
        
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'RewardPoints')
            BEGIN
                ALTER TABLE [Customers] ADD [RewardPoints] INT NOT NULL DEFAULT 0;
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'TotalSpent')
            BEGIN
                ALTER TABLE [Customers] ADD [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 0;
            END;
        ");

        return context;
    }

    private async Task<(AppDbContext Context, SalesOrderEntity Order, ProductVariantEntity Variant, InventoryEntity Inventory, WarehouseEntity Warehouse)> SetupTestContextAsync(int initialStock = 10, int orderQty = 2)
    {
        var context = CreateDbContext();
        
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Brand" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Base" };
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "WH", BranchId = branch.Id };
        warehouse.CreatedAt = DateTime.UtcNow;

        var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Accessories", SalePrice = 100, Sku = Guid.NewGuid().ToString() };
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = "123", RewardPoints = 0, TotalSpent = 0 };
        
        var order = new SalesOrderEntity 
        { 
            Id = Guid.NewGuid(), 
            Code = "SO-TEST-" + Guid.NewGuid().ToString().Substring(0, 4), 
            BranchId = branch.Id, 
            UserId = user.Id, 
            Status = SalesOrderStatus.Pending, 
            CustomerId = customer.Id,
            Subtotal = orderQty * 100,
            Total = orderQty * 100
        };

        var orderItem = new SalesOrderItemEntity
        {
            Id = Guid.NewGuid(),
            SalesOrderId = order.Id,
            ProductVariantId = product.Id,
            Quantity = orderQty,
            UnitPrice = 100
        };
        
        var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = initialStock };
        
        context.Categories.Add(category);
        context.Brands.Add(brand);
        context.Products.Add(productBase);
        context.Branches.Add(branch);
        context.Warehouses.Add(warehouse);
        context.ProductVariants.Add(product);
        context.Users.Add(user);
        context.Customers.Add(customer);
        context.SalesOrders.Add(order);
        context.SalesOrderItems.Add(orderItem);
        context.Inventories.Add(inventory);

        await context.SaveChangesAsync();

        return (context, order, product, inventory, warehouse);
    }

    [Fact]
    public async Task Complete_Success_DeductsInventory_And_CreatesSaleLedger()
    {
        var (setupContext, order, variant, inventory, warehouse) = await SetupTestContextAsync(10, 2);
        
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Completed);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedOrder = await assertContext.SalesOrders.FindAsync(order.Id);
        updatedOrder.Status.Should().Be(SalesOrderStatus.Completed);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(8);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Count.Should().Be(1);
        txns[0].Type.Should().Be(InventoryTransactionType.SALE);
        txns[0].QuantityChange.Should().Be(-2);
        txns[0].WarehouseId.Should().Be(warehouse.Id);
        txns[0].ProductVariantId.Should().Be(variant.Id);
    }

    [Fact]
    public async Task Cancel_Pending_NoInventoryChange_NoLedger()
    {
        var (setupContext, order, variant, inventory, warehouse) = await SetupTestContextAsync(10, 2);
        
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Cancelled);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedOrder = await assertContext.SalesOrders.FindAsync(order.Id);
        updatedOrder.Status.Should().Be(SalesOrderStatus.Cancelled);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Count.Should().Be(0);
    }

    [Fact]
    public async Task Cancel_Completed_AddsInventory_And_CreatesSaleReturnLedger()
    {
        var (setupContext, order, variant, inventory, warehouse) = await SetupTestContextAsync(10, 2);
        
        order.Status = SalesOrderStatus.Completed;
        inventory.Quantity = 8;
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Cancelled);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedOrder = await assertContext.SalesOrders.FindAsync(order.Id);
        updatedOrder.Status.Should().Be(SalesOrderStatus.Cancelled);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Count.Should().Be(1);
        txns[0].Type.Should().Be(InventoryTransactionType.SALE_RETURN);
        txns[0].QuantityChange.Should().Be(2);
    }

    [Fact]
    public async Task Double_Cancel_Completed_DoesNotDuplicateReturn()
    {
        var (setupContext, order, variant, inventory, warehouse) = await SetupTestContextAsync(10, 2);
        
        order.Status = SalesOrderStatus.Cancelled;
        inventory.Quantity = 10;
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Cancelled);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedOrder = await assertContext.SalesOrders.FindAsync(order.Id);
        updatedOrder.Status.Should().Be(SalesOrderStatus.Cancelled);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Count.Should().Be(0);
    }

    [Fact]
    public async Task MultiItem_Complete_DeductsBoth_CreatesTwoLedgers()
    {
        var context = CreateDbContext();
        
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Brand" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Base" };
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "WH", BranchId = branch.Id };
        warehouse.CreatedAt = DateTime.UtcNow;

        var productA = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Item A", SalePrice = 100, Sku = Guid.NewGuid().ToString() };
        var productB = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Item B", SalePrice = 200, Sku = Guid.NewGuid().ToString() };
        
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = "123" };
        
        var order = new SalesOrderEntity 
        { 
            Id = Guid.NewGuid(), 
            Code = "SO-TEST", 
            BranchId = branch.Id, 
            UserId = user.Id, 
            Status = SalesOrderStatus.Pending, 
            CustomerId = customer.Id,
            Subtotal = 800,
            Total = 800
        };

        var orderItemA = new SalesOrderItemEntity { Id = Guid.NewGuid(), SalesOrderId = order.Id, ProductVariantId = productA.Id, Quantity = 2, UnitPrice = 100 };
        var orderItemB = new SalesOrderItemEntity { Id = Guid.NewGuid(), SalesOrderId = order.Id, ProductVariantId = productB.Id, Quantity = 3, UnitPrice = 200 };
        
        var inventoryA = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = productA.Id, Quantity = 10 };
        var inventoryB = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = productB.Id, Quantity = 10 };
        
        context.Categories.Add(category);
        context.Brands.Add(brand);
        context.Products.Add(productBase);
        context.Branches.Add(branch);
        context.Warehouses.Add(warehouse);
        context.ProductVariants.Add(productA);
        context.ProductVariants.Add(productB);
        context.Users.Add(user);
        context.Customers.Add(customer);
        context.SalesOrders.Add(order);
        context.SalesOrderItems.Add(orderItemA);
        context.SalesOrderItems.Add(orderItemB);
        context.Inventories.Add(inventoryA);
        context.Inventories.Add(inventoryB);

        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Completed);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        
        var updatedInventoryA = await assertContext.Inventories.FindAsync(inventoryA.Id);
        updatedInventoryA.Quantity.Should().Be(8);
        
        var updatedInventoryB = await assertContext.Inventories.FindAsync(inventoryB.Id);
        updatedInventoryB.Quantity.Should().Be(7);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Count.Should().Be(2);
        
        var txnA = txns.Single(t => t.ProductVariantId == productA.Id);
        txnA.Type.Should().Be(InventoryTransactionType.SALE);
        txnA.QuantityChange.Should().Be(-2);

        var txnB = txns.Single(t => t.ProductVariantId == productB.Id);
        txnB.Type.Should().Be(InventoryTransactionType.SALE);
        txnB.QuantityChange.Should().Be(-3);
    }
    
    [Fact]
    public async Task Atomicity_Rollback_On_Failure()
    {
        var (setupContext, order, variant, inventory, warehouse) = await SetupTestContextAsync(10, 20);
        
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new SalesOrderCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<IIdempotencyService>().Object);

        var command = new UpdateSalesOrderStatusCommand(order.Id, SalesOrderStatus.Completed);
        
        await FluentActions.Invoking(() => handler.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<BadRequestException>();

        using var assertContext = CreateDbContext();
        var failedOrder = await assertContext.SalesOrders.FindAsync(order.Id);
        failedOrder.Status.Should().Be(SalesOrderStatus.Pending);

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == order.Id).ToListAsync();
        txns.Should().BeEmpty();
    }
}
