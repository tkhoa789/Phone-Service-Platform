using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Application.Modules.Warranty.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using PSP.Infrastructure.Data;
using DotNet.Testcontainers.Builders;
using Testcontainers.MsSql;
using PSP.Application.Common.Interfaces;
using Moq;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class WarrantyConcurrencyTests : IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();
        
    private Guid _customerId;
    private Guid _salesOrderId;
    private Guid _productVariantId;
    private string _imeiOriginal;
    private string _imeiNewInStock;
    private Guid _branchId;
    private Guid _userId;
    private Guid _warehouseId;

    public WarrantyConcurrencyTests()
    {
        _branchId = Guid.NewGuid();
        _userId = Guid.NewGuid();
        _warehouseId = Guid.NewGuid();
        _customerId = Guid.NewGuid();
        _salesOrderId = Guid.NewGuid();
        _productVariantId = Guid.NewGuid();
        _imeiOriginal = "WARR-IMEI-001";
        _imeiNewInStock = "WARR-IMEI-002";
    }

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_msSqlContainer.GetConnectionString())
            .Options;

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_userId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        
        var context = new AppDbContext(options, mockCurrentUserService.Object);
        context.Database.Migrate();
        return context;
    }

    public async Task InitializeAsync()
    {
        await _msSqlContainer.StartAsync();
        await using var context = CreateDbContext();
        
        // Setup base entities to satisfy FKs
        var branch = new PSP.Domain.Modules.Branch.Entities.BranchEntity { Id = _branchId, Name = "Test Branch" };
        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity { Id = _userId, BranchId = _branchId, FullName = "Admin", Email = "admin@test.com", PasswordHash = "x" };
        var customer = new CustomerEntity { Id = _customerId, FullName = "Customer", Phone = "12345", Code = "W-CUST-1" };
        var warehouse = new WarehouseEntity { Id = _warehouseId, Name = "Test WH", Code = "WH-WARR", BranchId = _branchId };
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat" };
        var brand = new PSP.Domain.Modules.Product.Entities.BrandEntity { Id = Guid.NewGuid(), Name = "Brand" };
        var product = new ProductEntity { Id = Guid.NewGuid(), Name = "Product", CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariantEntity { Id = _productVariantId, ProductId = product.Id, Sku = "SKU-1" };

        if (!await context.Set<CustomerEntity>().AnyAsync(c => c.Id == _customerId))
        {
            context.AddRange(branch, user, customer, warehouse, category, brand, product, variant);
            await context.SaveChangesAsync();
        }

        // Setup Original IMEI (Already Sold)
        var salesOrder = new SalesOrderEntity 
        { 
            Id = _salesOrderId, 
            CustomerId = _customerId, 
            Status = SalesOrderStatus.Completed, 
            CreatedAt = DateTime.UtcNow.AddMonths(-1),
            Code = "SO-WARR-1",
            UserId = _userId,
            BranchId = _branchId
        };
        var salesOrderItem = new SalesOrderItemEntity
        {
            Id = Guid.NewGuid(),
            SalesOrderId = _salesOrderId,
            ProductVariantId = _productVariantId,
            Imei = _imeiOriginal,
            Quantity = 1,
            UnitPrice = 1000
        };
        var imei1 = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = _imeiOriginal,
            ProductVariantId = _productVariantId,
            Status = ImeiStatus.Sold
        };

        // Setup New IMEI (In Stock)
        var imei2 = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = _imeiNewInStock,
            ProductVariantId = _productVariantId,
            WarehouseId = _warehouseId,
            Status = ImeiStatus.InStock
        };

        context.AddRange(salesOrder, salesOrderItem, imei1, imei2);
        await context.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _msSqlContainer.DisposeAsync();
    }

    private WarrantyCommandHandlers CreateHandler(AppDbContext context)
    {
        return new WarrantyCommandHandlers(new PSP.Infrastructure.Data.Repositories.UnitOfWork(context));
    }

    [Fact]
    public async Task T1_WarrantyLifecycle_NormalFlow_Succeeds()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        // 1. Create
        var createCommand = new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Screen broken");
        var ticketId = await handler.Handle(createCommand, CancellationToken.None);
        ticketId.Should().NotBeEmpty();

        var dbTicket1 = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        
        // 2. Update to Processing
        var update1 = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Processing, "Start repair", "Waiting for parts", null, dbTicket1.RowVersion);
        var res1 = await handler.Handle(update1, CancellationToken.None);
        res1.Should().BeTrue();

        var dbTicket2 = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        
        // 3. Update to Completed (Terminal)
        var update2 = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Completed, "Finished", "Fixed", null, dbTicket2.RowVersion);
        var res2 = await handler.Handle(update2, CancellationToken.None);
        res2.Should().BeTrue();
    }

    [Fact]
    public async Task T2_WarrantyConcurrentUpdate_ThrowsConflictException()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // Tech A payload
        var commandA = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Processing, "Action", null, null, dbTicket.RowVersion);
        // Tech B payload (Stale RowVersion)
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Cancelled, "Action", null, null, dbTicket.RowVersion);

        await handler.Handle(commandA, CancellationToken.None); // Tech A wins
        
        // Tech B fails
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandB, CancellationToken.None));
    }

    [Fact]
    public async Task T3_WarrantyConcurrentImeiSwap_PreventsDuplicateInventoryDeduction()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // Tech A and B both try to complete and swap IMEI with different phones!
        var commandA = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Completed, "Action A", null, _imeiNewInStock, dbTicket.RowVersion);
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Completed, "Action B", null, "SomeOtherImei", dbTicket.RowVersion);

        // Tech A wins
        await handler.Handle(commandA, CancellationToken.None);

        // Tech B fails because RowVersion changed, preventing a second swap
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandB, CancellationToken.None));

        // DB ASSERTIONS: Ensure no duplicate inventory deduction or history bloat
        var finalTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        finalTicket.Imei.Should().Be(_imeiNewInStock, "Chỉ duy nhất IMEI của Tech A được cập nhật vào phiếu");

        var newImei = await context.Set<ImeiEntity>().AsNoTracking().FirstAsync(i => i.Imei == _imeiNewInStock);
        newImei.Status.Should().Be(ImeiStatus.Sold, "IMEI mới bị trừ khỏi kho thành Sold");
        newImei.WarehouseId.Should().BeNull();

        var oldImei = await context.Set<ImeiEntity>().AsNoTracking().FirstAsync(i => i.Imei == _imeiOriginal);
        oldImei.Status.Should().Be(ImeiStatus.Disposed, "IMEI cũ bị thu hồi thành Disposed");

        var histories = await context.Set<WarrantyHistoryEntity>().AsNoTracking().Where(h => h.WarrantyTicketId == ticketId).ToListAsync();
        // 1 for Create, 1 for Tech A Complete
        histories.Should().HaveCount(2, "Không được lưu lịch sử thay đổi của giao dịch thất bại");
        histories.Any(h => h.Action == "Action A").Should().BeTrue();
        histories.Any(h => h.Action == "Action B").Should().BeFalse();
    }

    [Fact]
    public async Task T4_WarrantyTerminalState_CannotBeModified_EvenConcurrently()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // A completes it
        var commandA = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Completed, "Action", null, null, dbTicket.RowVersion);
        await handler.Handle(commandA, CancellationToken.None);

        var dbTicket2 = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // B tries to update it to Rejected after it's Completed
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Rejected, "Action", null, null, dbTicket2.RowVersion);
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(commandB, CancellationToken.None));
        ex.Message.Should().Contain("không thể cập nhật thêm");
    }

    [Fact]
    public async Task T5_WarrantyStateTransition_ValidatesBusinessRules()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // Invalid transition: Received -> Received (Invalid)
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Received, "Action", null, null, dbTicket.RowVersion);
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(commandB, CancellationToken.None));
        ex.Message.Should().Contain("Chuyển đổi trạng thái không hợp lệ");
    }

    [Fact]
    public async Task T6_Concurrent_Approve_Vs_Reject_ReturnsConflict()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // A processes
        var commandA = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Processing, "Start", null, null, dbTicket.RowVersion);
        // B rejects
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Rejected, "Reject", null, null, dbTicket.RowVersion);

        await handler.Handle(commandA, CancellationToken.None);
        
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandB, CancellationToken.None));

        var finalTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        finalTicket.Status.Should().Be(WarrantyTicketStatus.Processing);
    }

    [Fact]
    public async Task T7_Concurrent_Complete_Vs_Cancel_ReturnsConflict()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);

        var ticketId = await handler.Handle(new CreateWarrantyTicketCommand(_customerId, _productVariantId, _imeiOriginal, "Issue"), CancellationToken.None);
        var dbTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        
        var update1 = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Processing, "Start", null, null, dbTicket.RowVersion);
        await handler.Handle(update1, CancellationToken.None);
        var processTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);

        // A completes
        var commandA = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Completed, "Complete", null, null, processTicket.RowVersion);
        // B cancels
        var commandB = new UpdateWarrantyStatusCommand(ticketId, WarrantyTicketStatus.Cancelled, "Cancel", null, null, processTicket.RowVersion);

        await handler.Handle(commandA, CancellationToken.None);
        
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandB, CancellationToken.None));

        var finalTicket = await context.Set<WarrantyTicketEntity>().AsNoTracking().FirstAsync(t => t.Id == ticketId);
        finalTicket.Status.Should().Be(WarrantyTicketStatus.Completed);
    }
}
