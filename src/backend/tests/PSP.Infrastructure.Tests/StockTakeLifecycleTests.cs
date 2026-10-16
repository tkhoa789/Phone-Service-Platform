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
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Infrastructure.Data.Repositories;
using System.Collections.Generic;

namespace PSP.Infrastructure.Tests;

public class StockTakeLifecycleTests : IAsyncLifetime
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

        // Topo fix for FK constraints
        context.Database.ExecuteSqlRaw("ALTER TABLE AuditLogs NOCHECK CONSTRAINT ALL;");
        
        return context;
    }

    private async Task<(AppDbContext Context, StockTakeEntity StockTake, ProductVariantEntity Variant, InventoryEntity Inventory, WarehouseEntity Warehouse)> SetupTestContextAsync(int initialStock = 10, int actualStock = 10, bool isMobile = false)
    {
        var context = CreateDbContext();
        
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat", Code = isMobile ? "MOBILE" : "ACC" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Brand" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Base" };
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "WH", BranchId = branch.Id };
        
        var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Accessories", SalePrice = 100, Sku = Guid.NewGuid().ToString() };
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        
        var stockTake = new StockTakeEntity 
        { 
            Id = Guid.NewGuid(), 
            Code = "STK-TEST-" + Guid.NewGuid().ToString().Substring(0, 4), 
            WarehouseId = warehouse.Id,
            Status = StockTakeStatus.InProgress
        };

        var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = initialStock };

        var item = new StockTakeItemEntity
        {
            Id = Guid.NewGuid(),
            StockTakeId = stockTake.Id,
            ProductVariantId = product.Id,
            SystemQuantity = initialStock,
            ActualQuantity = actualStock,
            Difference = actualStock - initialStock
        };

        context.Categories.Add(category);
        context.Brands.Add(brand);
        context.Products.Add(productBase);
        context.ProductVariants.Add(product);
        context.Branches.Add(branch);
        context.Warehouses.Add(warehouse);
        context.Users.Add(user);
        context.Inventories.Add(inventory);
        context.StockTakes.Add(stockTake);
        context.StockTakeItems.Add(item);

        if (isMobile)
        {
            for (int i = 0; i < initialStock; i++) // We will only generate what is in DB
            {
                context.Imeis.Add(new ImeiEntity 
                { 
                    Id = Guid.NewGuid(), 
                    Imei = $"IMEI-{i}", 
                    ProductVariantId = product.Id, 
                    WarehouseId = warehouse.Id, 
                    Status = ImeiStatus.InStock 
                });
            }
        }

        await context.SaveChangesAsync();
        
        return (context, stockTake, product, inventory, warehouse);
    }

    [Fact]
    public async Task Complete_WithPositiveDelta_CreatesLedgerUp()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 12);
        
        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.Should().BeTrue();

        var updatedInventory = await context.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(12);

        var tx = await context.InventoryTransactions.SingleOrDefaultAsync(t => t.ReferenceId == stockTake.Id);
        tx.Should().NotBeNull();
        tx.Type.Should().Be(InventoryTransactionType.STOCKTAKE_ADJUSTMENT);
        tx.QuantityChange.Should().Be(2);
    }

    [Fact]
    public async Task Complete_WithNegativeDelta_CreatesLedgerDown()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 7);
        
        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.Should().BeTrue();

        var updatedInventory = await context.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(7);

        var tx = await context.InventoryTransactions.SingleOrDefaultAsync(t => t.ReferenceId == stockTake.Id);
        tx.Should().NotBeNull();
        tx.Type.Should().Be(InventoryTransactionType.STOCKTAKE_ADJUSTMENT);
        tx.QuantityChange.Should().Be(-3);
    }

    [Fact]
    public async Task Complete_WithZeroDelta_SkipsLedger()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 10);
        
        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.Should().BeTrue();

        var updatedInventory = await context.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10);

        var txCount = await context.InventoryTransactions.CountAsync(t => t.ReferenceId == stockTake.Id);
        txCount.Should().Be(0);
    }

    [Fact]
    public async Task Complete_WithConcurrency_CalculatesCorrectDelta()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 9); // Delta = -1
        
        // Simulating an intervening sale that changed the db quantity to 8
        inventory.Quantity = 8;
        context.Inventories.Update(inventory);
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        var result = await handler.Handle(cmd, CancellationToken.None);
        result.Should().BeTrue();

        var updatedInventory = await context.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(7); // 8 + (-1) = 7

        var tx = await context.InventoryTransactions.SingleOrDefaultAsync(t => t.ReferenceId == stockTake.Id);
        tx.QuantityChange.Should().Be(-1);
    }

    [Fact]
    public async Task Complete_MissingImei_ThrowsConflictException()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 2, actualStock: 1, isMobile: true);
        
        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand 
        { 
            Id = stockTake.Id, 
            VariantImeis = new List<ProductVariantImeisDto> 
            { 
                new ProductVariantImeisDto { ProductVariantId = variant.Id, Imeis = new List<string> { "IMEI-0" } } 
            } 
        };
        
        Func<Task> act = async () => await handler.Handle(cmd, CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>().WithMessage("*Discrepancy: IMEI*");
    }

    [Fact]
    public async Task Complete_ImeiSold_ThrowsConflictException()
    {
        var (context, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 1, actualStock: 1, isMobile: true);
        
        var imei = await context.Imeis.FirstAsync();
        imei.Status = ImeiStatus.Sold;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand 
        { 
            Id = stockTake.Id, 
            VariantImeis = new List<ProductVariantImeisDto> 
            { 
                new ProductVariantImeisDto { ProductVariantId = variant.Id, Imeis = new List<string> { "IMEI-0" } } 
            } 
        };
        
        Func<Task> act = async () => await handler.Handle(cmd, CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>().WithMessage("*đang ở trạng thái*");
    }

    [Fact]
    public async Task Complete_RowVersionConflict_ThrowsConcurrencyException()
    {
        var (context1, stockTake, variant, inventory, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 12);
        var context2 = CreateDbContext(); // 2nd context to simulate concurrency

        // Context 1 prepares the command
        var uow1 = new UnitOfWork(context1);
        var handler1 = new StockTakeCommandHandlers(uow1);

        // Context 2 modifies the inventory independently BEFORE context 1 saves
        var inv2 = await context2.Inventories.FindAsync(inventory.Id);
        inv2.Quantity = 5;
        await context2.SaveChangesAsync(); 

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        Func<Task> act = async () => await handler1.Handle(cmd, CancellationToken.None);
        
        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();
    }

    [Fact]
    public async Task Complete_MultiItemStockTake()
    {
        var (context, stockTake, variant1, inventory1, warehouse) = await SetupTestContextAsync(initialStock: 10, actualStock: 12);
        
        var variant2 = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = variant1.ProductId, Name = "V2", SalePrice = 100, Sku = "V2" };
        var inventory2 = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = variant2.Id, Quantity = 5 };
        var item2 = new StockTakeItemEntity
        {
            Id = Guid.NewGuid(),
            StockTakeId = stockTake.Id,
            ProductVariantId = variant2.Id,
            SystemQuantity = 5,
            ActualQuantity = 4,
            Difference = -1
        };

        context.ProductVariants.Add(variant2);
        context.Inventories.Add(inventory2);
        context.StockTakeItems.Add(item2);
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new StockTakeCommandHandlers(uow);

        var cmd = new CompleteStockTakeCommand { Id = stockTake.Id, VariantImeis = new List<ProductVariantImeisDto>() };
        
        var result = await handler.Handle(cmd, CancellationToken.None);
        result.Should().BeTrue();

        var txs = await context.InventoryTransactions.Where(t => t.ReferenceId == stockTake.Id).ToListAsync();
        txs.Count.Should().Be(2);
        txs.Single(t => t.ProductVariantId == variant1.Id).QuantityChange.Should().Be(2);
        txs.Single(t => t.ProductVariantId == variant2.Id).QuantityChange.Should().Be(-1);
    }
}
