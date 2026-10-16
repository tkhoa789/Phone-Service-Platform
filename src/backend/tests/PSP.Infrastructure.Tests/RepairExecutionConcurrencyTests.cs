using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PSP.Domain.Modules.Repair.Entities;
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
using PSP.Application.Modules.Repair.Commands;
using PSP.Application.Modules.Repair.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;

namespace PSP.Infrastructure.Tests;

public class RepairExecutionConcurrencyTests : IAsyncLifetime
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

    [Fact]
    public async Task ConcurrentIssue_InsufficientStock_OnePassesOneFailsWithCheckConstraint()
    {
        // Arrange
        using var seedContext = CreateDbContext();
        
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch 1" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), BranchId = branch.Id, Name = "Warehouse 1" };
        var brand = new PSP.Domain.Modules.Product.Entities.BrandEntity { Id = Guid.NewGuid(), Name = "Brand 1" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), Name = "Base Phone", CategoryId = Guid.NewGuid(), BrandId = brand.Id };
        var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Screen", SalePrice = 100 };
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = "123" };
        var ticket = new RepairTicketEntity { Id = Guid.NewGuid(), Code = "T1", BranchId = branch.Id, ReceivedById = user.Id, Status = RepairTicketStatus.Repairing, CustomerId = customer.Id, ProductVariantId = product.Id };
        
        // Cố tình chỉ thiết lập kho hàng có Quantity = 1
        var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = 1 };

        seedContext.Branches.Add(branch);
        seedContext.Warehouses.Add(warehouse);
        
        // Add fake category and brand to avoid FK error on Product
        var category = new PSP.Domain.Modules.Product.Entities.CategoryEntity { Id = productBase.CategoryId, Name = "Cat" };
        seedContext.Categories.Add(category);
        seedContext.Brands.Add(brand);
        seedContext.Products.Add(productBase);
        
        seedContext.ProductVariants.Add(product);
        seedContext.Users.Add(user);
        seedContext.Customers.Add(customer);
        seedContext.RepairTickets.Add(ticket);
        seedContext.Inventories.Add(inventory);
        await seedContext.SaveChangesAsync();

        // Act
        // Khởi tạo 2 DbContext song song cho 2 request
        using var context1 = CreateDbContext();
        using var context2 = CreateDbContext();

        var handler1 = new RepairCommandHandlers(new PSP.Infrastructure.Data.Repositories.UnitOfWork(context1), new Mock<ICurrentUserService>().Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);
        var handler2 = new RepairCommandHandlers(new PSP.Infrastructure.Data.Repositories.UnitOfWork(context2), new Mock<ICurrentUserService>().Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var command1 = new AddRepairPartCommand(ticket.Id, product.Id, 1, null, true);
        var command2 = new AddRepairPartCommand(ticket.Id, product.Id, 1, null, true);

        // Chạy đồng thời
        var task1 = handler1.Handle(command1, CancellationToken.None);
        var task2 = handler2.Handle(command2, CancellationToken.None);

        var tasks = new[] { task1, task2 };
        Exception? exception = null;

        try
        {
            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            exception = ex;
        }

        // Assert
        exception.Should().NotBeNull();
        exception.Should().Match(e => e is ConflictException || e is InventoryNotEnoughException); // Lỗi có thể là từ Check Constraint (ConflictException) hoặc từ logic ứng dụng (InventoryNotEnoughException) do race condition.
        
        using var assertContext = CreateDbContext();
        var finalInventory = await assertContext.Inventories.FirstAsync(i => i.Id == inventory.Id);
        finalInventory.Quantity.Should().Be(0); // Kho không được âm, kết thúc chính xác ở 0

        var parts = await assertContext.RepairParts.Where(p => p.RepairTicketId == ticket.Id).ToListAsync();
        parts.Count.Should().Be(1); // Chỉ có 1 part được issue thành công

        var ledgers = await assertContext.InventoryTransactions.ToListAsync();
        ledgers.Count.Should().Be(1); // Chỉ có 1 ledger được sinh ra
        ledgers[0].QuantityChange.Should().Be(-1);
    }

    [Fact]
    public async Task ConcurrentIssue_SameImei_UniqueConstraintThrowsConflict()
    {
        // Arrange
        using var seedContext = CreateDbContext();
        
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch 1" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), BranchId = branch.Id, Name = "Warehouse 1" };
        var brand = new PSP.Domain.Modules.Product.Entities.BrandEntity { Id = Guid.NewGuid(), Name = "Brand 1" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), Name = "Base Phone", CategoryId = Guid.NewGuid(), BrandId = brand.Id };
        var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Mainboard", SalePrice = 500 };
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = "123" };
        
        var ticket1 = new RepairTicketEntity { Id = Guid.NewGuid(), Code = "T1", BranchId = branch.Id, ReceivedById = user.Id, Status = RepairTicketStatus.Repairing, CustomerId = customer.Id, ProductVariantId = product.Id };
        var ticket2 = new RepairTicketEntity { Id = Guid.NewGuid(), Code = "T2", BranchId = branch.Id, ReceivedById = user.Id, Status = RepairTicketStatus.Repairing, CustomerId = customer.Id, ProductVariantId = product.Id };
        
        var imei = new ImeiEntity { Id = Guid.NewGuid(), ProductVariantId = product.Id, Imei = "IMEI123", Status = ImeiStatus.InStock };
        var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = 2 }; // Dư dả số lượng

        seedContext.Branches.Add(branch);
        seedContext.Warehouses.Add(warehouse);
        
        var category = new PSP.Domain.Modules.Product.Entities.CategoryEntity { Id = productBase.CategoryId, Name = "Cat" };
        seedContext.Categories.Add(category);
        seedContext.Brands.Add(brand);
        seedContext.Products.Add(productBase);
        
        seedContext.ProductVariants.Add(product);
        seedContext.Users.Add(user);
        seedContext.Customers.Add(customer);
        seedContext.RepairTickets.Add(ticket1);
        seedContext.RepairTickets.Add(ticket2);
        seedContext.Imeis.Add(imei);
        seedContext.Inventories.Add(inventory);
        await seedContext.SaveChangesAsync();

        // Act
        using var context1 = CreateDbContext();
        using var context2 = CreateDbContext();

        var handler1 = new RepairCommandHandlers(new PSP.Infrastructure.Data.Repositories.UnitOfWork(context1), new Mock<ICurrentUserService>().Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);
        var handler2 = new RepairCommandHandlers(new PSP.Infrastructure.Data.Repositories.UnitOfWork(context2), new Mock<ICurrentUserService>().Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        // Cả 2 kỹ thuật viên cùng chọn IMEI này cho 2 ticket khác nhau tại cùng 1 phần nghìn giây
        var command1 = new AddRepairPartCommand(ticket1.Id, product.Id, 1, imei.Id, true);
        var command2 = new AddRepairPartCommand(ticket2.Id, product.Id, 1, imei.Id, true);

        var task1 = handler1.Handle(command1, CancellationToken.None);
        var task2 = handler2.Handle(command2, CancellationToken.None);

        Exception? exception = null;

        try
        {
            await Task.WhenAll(task1, task2);
        }
        catch (Exception ex)
        {
            exception = ex;
        }

        // Assert
        exception.Should().NotBeNull();
        exception.Should().BeOfType<ConflictException>(); // Index constraint IX_RepairParts_ImeiId catches this or DbUpdateConcurrencyException
        
        using var assertContext = CreateDbContext();
        var parts = await assertContext.RepairParts.Where(p => p.ImeiId == imei.Id).ToListAsync();
        parts.Count.Should().Be(1); // Một IMEI chỉ được nằm trong 1 Part duy nhất

        var finalImei = await assertContext.Imeis.FirstAsync(i => i.Id == imei.Id);
        finalImei.Status.Should().Be(ImeiStatus.Repairing);
        
        var ledgers = await assertContext.InventoryTransactions.ToListAsync();
        ledgers.Count.Should().Be(1);
    }
}
