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
using PSP.Infrastructure.Data.Repositories;
using System.Collections.Generic;

namespace PSP.Infrastructure.Tests;

public class RepairLifecycleTests : IAsyncLifetime
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

    private async Task<(AppDbContext Context, RepairTicketEntity Ticket, RepairPartEntity Part, InventoryEntity Inventory)> SetupTestContextAsync()
    {
        var context = CreateDbContext();
        
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Brand" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Base" };
        var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "WH" };
        var branch = new BranchEntity { Id = Guid.NewGuid(), Name = "Branch" };
        warehouse.BranchId = branch.Id;

        var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Screen", SalePrice = 100 };
        var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech@test.com", BranchId = branch.Id };
        var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = "123" };
        var ticket = new RepairTicketEntity { Id = Guid.NewGuid(), Code = "T" + Guid.NewGuid().ToString().Substring(0, 4), BranchId = branch.Id, ReceivedById = user.Id, Status = RepairTicketStatus.Repairing, CustomerId = customer.Id, ProductVariantId = product.Id };
        
        var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = 10 };
        
        var part = new RepairPartEntity 
        { 
            Id = Guid.NewGuid(), 
            RepairTicketId = ticket.Id, 
            ProductVariantId = product.Id, 
            Quantity = 1, 
            Status = RepairPartStatus.Reserved,
            UnitPrice = 50
        };

        context.Categories.Add(category);
        context.Brands.Add(brand);
        context.Products.Add(productBase);
        context.Warehouses.Add(warehouse);
        context.Branches.Add(branch);
        context.ProductVariants.Add(product);
        context.Users.Add(user);
        context.Customers.Add(customer);
        context.RepairTickets.Add(ticket);
        context.Inventories.Add(inventory);
        context.RepairParts.Add(part);

        await context.SaveChangesAsync();

        return (context, ticket, part, inventory);
    }

    [Fact]
    public async Task Issue_Success_DeductsInventory_And_CreatesLedger()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, part.RowVersion);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.Issued);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(9); // 10 - 1

        var txn = await assertContext.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == part.Id);
        txn.Should().NotBeNull();
        txn.Type.Should().Be(InventoryTransactionType.REPAIR_ISSUE);
        txn.QuantityChange.Should().Be(-1);
    }

    [Fact]
    public async Task Return_Success_AddsInventory_And_CreatesLedger()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        // Force part to be issued first
        part.Status = RepairPartStatus.Issued;
        inventory.Quantity = 9; // Assume it was deducted
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var command = new ReturnRepairPartCommand(ticket.Id, part.Id, part.RowVersion);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.Returned);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10); // 9 + 1

        var txn = await assertContext.InventoryTransactions.FirstOrDefaultAsync(t => t.Type == InventoryTransactionType.REPAIR_RETURN);
        txn.Should().NotBeNull();
        txn.QuantityChange.Should().Be(1);
    }

    [Fact]
    public async Task WriteOff_Success_LeavesInventoryIntact_And_CreatesLedger_QtyZero()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        part.Status = RepairPartStatus.Issued;
        inventory.Quantity = 9; 
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var command = new WriteOffRepairPartCommand(ticket.Id, part.Id, "Broken during install", part.RowVersion);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.WriteOff);
        updatedPart.CostAtWriteOff.Should().Be(50);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(9); // Unchanged from 9

        var txn = await assertContext.InventoryTransactions.FirstOrDefaultAsync(t => t.Type == InventoryTransactionType.REPAIR_WRITEOFF);
        txn.Should().NotBeNull();
        txn.QuantityChange.Should().Be(0);
    }

    [Fact]
    public async Task CancelTicket_ForcesDispositions_TransitionsParts()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        part.Status = RepairPartStatus.Issued;
        inventory.Quantity = 9;
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var disp = new RepairPartDispositionDto(part.Id, RepairPartStatus.Returned, null);
        var command = new CancelRepairTicketCommand(ticket.Id, "Cancel test", new List<RepairPartDispositionDto> { disp });
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedTicket = await assertContext.RepairTickets.FindAsync(ticket.Id);
        updatedTicket.Status.Should().Be(RepairTicketStatus.Cancelled);

        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.Returned);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(10); // Returned
    }
    [Fact]
    public async Task Install_Success_NoInventoryChange_NoLedger()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        // Force part to be issued first
        part.Status = RepairPartStatus.Issued;
        inventory.Quantity = 9; 
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Installed, part.RowVersion);
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.Installed);

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(9); // No change

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == part.Id).ToListAsync();
        txns.Should().BeEmpty(); // No ledger created for Install
    }

    [Fact]
    public async Task Invalid_Lifecycle_Transitions_Throw_Conflict()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        // Reserved -> Installed (Invalid)
        var command1 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Installed, part.RowVersion);
        await FluentActions.Invoking(() => handler.Handle(command1, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();

        // Installed -> Issued (Invalid)
        part.Status = RepairPartStatus.Installed;
        await setupContext.SaveChangesAsync();
        var command2 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, part.RowVersion);
        await FluentActions.Invoking(() => handler.Handle(command2, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
            
        // Returned -> Installed (Invalid)
        part.Status = RepairPartStatus.Returned;
        await setupContext.SaveChangesAsync();
        var command3 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Installed, part.RowVersion);
        await FluentActions.Invoking(() => handler.Handle(command3, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();

        // WriteOff -> Installed (Invalid)
        part.Status = RepairPartStatus.WriteOff;
        await setupContext.SaveChangesAsync();
        var command4 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Installed, part.RowVersion);
        await FluentActions.Invoking(() => handler.Handle(command4, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CancelTicket_WithWriteOffDisposition_LeavesInventoryIntact()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        part.Status = RepairPartStatus.Issued;
        inventory.Quantity = 9;
        await setupContext.SaveChangesAsync();

        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var disp = new RepairPartDispositionDto(part.Id, RepairPartStatus.WriteOff, "Cancel and lost");
        var command = new CancelRepairTicketCommand(ticket.Id, "Cancel test", new List<RepairPartDispositionDto> { disp });
        await handler.Handle(command, CancellationToken.None);

        using var assertContext = CreateDbContext();
        var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
        updatedPart.Status.Should().Be(RepairPartStatus.WriteOff);
        updatedPart.CostAtWriteOff.Should().Be(50);
        updatedPart.IsDeleted.Should().BeFalse(); // Ensure not deleted!

        var updatedInventory = await assertContext.Inventories.FindAsync(inventory.Id);
        updatedInventory.Quantity.Should().Be(9); // Unchanged

        var txn = await assertContext.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == part.Id && t.Type == InventoryTransactionType.REPAIR_WRITEOFF);
        txn.Should().NotBeNull();
    }
    
        [Fact]
    public async Task DuplicateAction_Is_Prevented_By_RowVersion()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        // Capture initial row version
        var initialRowVersion = part.RowVersion;
        
        // Setup initial handler
        var uow1 = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler1 = new RepairCommandHandlers(uow1, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        // Action 1: Issue
        var command1 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, initialRowVersion);
        await handler1.Handle(command1, CancellationToken.None);
        
        // Action 2: Concurrent Issue using old RowVersion
        using var setupContext2 = CreateDbContext();
        var uow2 = new UnitOfWork(setupContext2);
        var handler2 = new RepairCommandHandlers(uow2, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);
        var command2 = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, initialRowVersion); // Same old row version

        var exception = await Record.ExceptionAsync(() => handler2.Handle(command2, CancellationToken.None));
        exception.Should().NotBeNull();
        exception.Should().BeOfType<ConflictException>(); // RowVersion conflict maps to ConflictException

        using var assertContext = CreateDbContext();
        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == part.Id).ToListAsync();
        txns.Count.Should().Be(1); // No duplicate ledger!
    }
    
    [Fact]
    public async Task Atomicity_Rollback_On_Failure()
    {
        var (setupContext, ticket, part, inventory) = await SetupTestContextAsync();
        
        var uow = new UnitOfWork(setupContext);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.BranchId).Returns(ticket.BranchId.ToString());
        var handler = new RepairCommandHandlers(uow, mockCurrentUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        // Modify the inventory to artificially fail DB constraint CK_Inventory_Quantity
        inventory.Quantity = 0; 
        await setupContext.SaveChangesAsync();

        var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, part.RowVersion);
        
        // Should throw ConflictException mapped from DbUpdateException
        await FluentActions.Invoking(() => handler.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();

        // Verify atomicity - part should remain Reserved, no ledger created
        using var assertContext = CreateDbContext();
        var failedPart = await assertContext.RepairParts.FindAsync(part.Id);
        failedPart.Status.Should().Be(RepairPartStatus.Reserved); // Rolled back

        var txns = await assertContext.InventoryTransactions.Where(t => t.ReferenceId == part.Id).ToListAsync();
        txns.Should().BeEmpty(); // Rolled back ledger
    }
}


