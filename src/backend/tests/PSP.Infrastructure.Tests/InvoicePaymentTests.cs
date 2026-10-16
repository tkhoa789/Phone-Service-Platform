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
using MediatR;

namespace PSP.Infrastructure.Tests;

public class InvoicePaymentTests : IAsyncLifetime
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

        var user = context.Users.Find(_currentUserId);
        if (user == null)
        {
            var adminBranch = new BranchEntity { Id = Guid.NewGuid(), Code = "ADMIN", Name = "Admin", Address = "Admin" };
            context.Branches.Add(adminBranch);
            context.Users.Add(new UserEntity { Id = _currentUserId, BranchId = adminBranch.Id, Username = "testuser", Email = "test@test.com", FullName = "Test" });
            context.SaveChanges();
        }

        return context;
    }

    private InvoiceCommandHandlers CreateHandler(AppDbContext context, IMediator mediator)
    {
        var unitOfWork = new UnitOfWork(context);
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);

        var mockIdempotencyService = new Mock<IIdempotencyService>();

        return new InvoiceCommandHandlers(unitOfWork, mediator, mockCurrentUserService.Object, mockIdempotencyService.Object);
    }

    [Fact]
    public async Task CreatePayment_PartialAmount_LeavesInvoiceAsIssued()
    {
        var dbContext = CreateDbContext();
        var mockMediator = new Mock<IMediator>();
        var handler = CreateHandler(dbContext, mockMediator.Object);

        var method = new PaymentMethodEntity { Code = "CASH", Name = "Cash", IsActive = true };
        dbContext.Set<PaymentMethodEntity>().Add(method);

        var branch = new BranchEntity { Code = "B1", Name = "B1", Address = "A" };
        dbContext.Set<BranchEntity>().Add(branch);

        var invoiceId = Guid.NewGuid();
        var invoice = new InvoiceEntity
        {
            Id = invoiceId,
            Code = "INV-" + Guid.NewGuid().ToString().Substring(0, 5),
            Amount = 1000,
            Status = InvoiceStatus.Issued,
            BranchId = branch.Id
        };
        dbContext.Set<InvoiceEntity>().Add(invoice);
        await dbContext.SaveChangesAsync();

        var command = new CreatePaymentCommand(invoiceId, method.Id, "TX-001", 400);
        await handler.Handle(command, CancellationToken.None);

        var updatedInvoice = await dbContext.Set<InvoiceEntity>().FindAsync(invoiceId);
        Assert.Equal(InvoiceStatus.Issued, updatedInvoice.Status);

        var payments = await dbContext.Set<PaymentEntity>().Where(x => x.InvoiceId == invoiceId).ToListAsync();
        Assert.Single(payments);
        Assert.Equal(400, payments[0].Amount);

        // Mediator should NOT be called to update sales order
        mockMediator.Verify(m => m.Send(It.IsAny<UpdateSalesOrderStatusCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreatePayment_FullAmount_TransitionsInvoiceToPaid_AndOrderToCompleted()
    {
        var dbContext = CreateDbContext();
        var mockMediator = new Mock<IMediator>();
        var handler = CreateHandler(dbContext, mockMediator.Object);

        var branch = new BranchEntity { Code = "B2", Name = "B2", Address = "A" };
        var customer = new CustomerEntity { FullName = "C1", Phone = "123" };
        dbContext.AddRange(branch, customer);

        var order = new SalesOrderEntity
        {
            Id = Guid.NewGuid(),
            Code = "SO-FULL",
            Status = SalesOrderStatus.Pending,
            Total = 1500,
            BranchId = branch.Id,
            CustomerId = customer.Id,
            UserId = _currentUserId
        };
        dbContext.Set<SalesOrderEntity>().Add(order);

        var invoice = new InvoiceEntity
        {
            Id = Guid.NewGuid(),
            Code = "INV-FULL",
            Amount = 1500,
            Status = InvoiceStatus.Issued,
            SalesOrderId = order.Id,
            BranchId = branch.Id
        };
        dbContext.Set<InvoiceEntity>().Add(invoice);

        var method = new PaymentMethodEntity { Code = "CASH2", Name = "Cash2", IsActive = true };
        dbContext.Set<PaymentMethodEntity>().Add(method);

        await dbContext.SaveChangesAsync();

        var command = new CreatePaymentCommand(invoice.Id, method.Id, "TX-FULL", 1500);
        await handler.Handle(command, CancellationToken.None);

        var updatedInvoice = await dbContext.Set<InvoiceEntity>().FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.Paid, updatedInvoice.Status);

        // Mock mediator SHOULD be called
        mockMediator.Verify(m => m.Send(It.Is<UpdateSalesOrderStatusCommand>(c => c.Id == order.Id && c.Status == SalesOrderStatus.Completed), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreatePayment_FullAmount_WhenInventoryFails_RollsBackTransaction_AndThrowsException()
    {
        var dbContext = CreateDbContext();
        var mockMediator = new Mock<IMediator>();
        // Simulate inventory failure by throwing ConflictException when MediatR is called
        mockMediator.Setup(m => m.Send(It.IsAny<UpdateSalesOrderStatusCommand>(), It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new ConflictException("Not enough inventory"));

        var handler = CreateHandler(dbContext, mockMediator.Object);

        var branch = new BranchEntity { Code = "B3", Name = "B3", Address = "A" };
        var customer = new CustomerEntity { FullName = "C3", Phone = "333" };
        dbContext.AddRange(branch, customer);

        var order = new SalesOrderEntity
        {
            Id = Guid.NewGuid(),
            Code = "SO-FAIL",
            Status = SalesOrderStatus.Pending,
            Total = 2000,
            BranchId = branch.Id,
            CustomerId = customer.Id,
            UserId = _currentUserId
        };
        dbContext.Add(order);

        var invoice = new InvoiceEntity
        {
            Id = Guid.NewGuid(),
            Code = "INV-FAIL",
            Amount = 2000,
            Status = InvoiceStatus.Issued,
            SalesOrderId = order.Id,
            BranchId = branch.Id
        };
        dbContext.Add(invoice);

        var method = new PaymentMethodEntity { Code = "CASH3", Name = "Cash", IsActive = true };
        dbContext.Add(method);

        await dbContext.SaveChangesAsync();

        var command = new CreatePaymentCommand(invoice.Id, method.Id, "TX-FAIL", 2000);
        
        // This MUST throw to the user, because transaction failed and rolled back
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));

        dbContext.ChangeTracker.Clear();

        var updatedInvoice = await dbContext.Set<InvoiceEntity>().FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.Issued, updatedInvoice.Status); // Invoice is rolled back to Issued!

        var payments = await dbContext.Set<PaymentEntity>().Where(x => x.InvoiceId == invoice.Id).ToListAsync();
        Assert.Empty(payments); // Payment record is rolled back!
    }

    [Fact]
    public async Task CreatePayment_ConcurrentIdenticalRequests_OnlyOneSucceeds()
    {
        var dbContext = CreateDbContext();

        var branch = new BranchEntity { Code = "B4", Name = "B4", Address = "A" };
        var method = new PaymentMethodEntity { Code = "CASH4", Name = "Cash", IsActive = true };
        dbContext.AddRange(branch, method);

        var invoice = new InvoiceEntity
        {
            Id = Guid.NewGuid(),
            Code = "INV-CONC",
            Amount = 1000,
            Status = InvoiceStatus.Issued,
            BranchId = branch.Id
        };
        dbContext.Add(invoice);
        await dbContext.SaveChangesAsync();

        int threadCount = 3;
        var exceptions = new Exception[threadCount];
        var tasks = new Task[threadCount];
        var startEvent = new ManualResetEvent(false);

        for (int i = 0; i < threadCount; i++)
        {
            int index = i;
            tasks[i] = Task.Run(async () =>
            {
                var innerContext = CreateDbContext();
                var mockMediator = new Mock<IMediator>();
                var handler = CreateHandler(innerContext, mockMediator.Object);

                startEvent.WaitOne();

                try
                {
                    var command = new CreatePaymentCommand(invoice.Id, method.Id, $"TX-CONC-{index}", 1000);
                    await handler.Handle(command, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    exceptions[index] = ex;
                }
            });
        }

        startEvent.Set();
        await Task.WhenAll(tasks);

        int successCount = exceptions.Count(e => e == null);
        int conflictCount = exceptions.Count(e => e is ConflictException);

        Assert.Equal(1, successCount); 
        // Other threads may throw DbUpdateConcurrencyException or BadRequestException depending on exact timing.
        // What matters is exactly ONE payment succeeds and the total amount is correct. 

        var dbContextVerify = CreateDbContext();
        var updatedInvoice = await dbContextVerify.Set<InvoiceEntity>().FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.Paid, updatedInvoice.Status);

        var payments = await dbContextVerify.Set<PaymentEntity>().Where(x => x.InvoiceId == invoice.Id).ToListAsync();
        Assert.Single(payments);
        Assert.Equal(1000, payments.Sum(p => p.Amount));
    }
}
