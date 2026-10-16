using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Testcontainers.MsSql;
using PSP.Application.Common.Interfaces;
using Moq;
using Xunit;
using PSP.Application.Modules.Customer.Commands;
using PSP.Application.Modules.Customer.Handlers;
using PSP.Domain.Common.Exceptions;

namespace PSP.Infrastructure.Tests;

public class CustomerConcurrencyTests : IAsyncLifetime
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
        
        // Seed branch to satisfy FK_Users_Branches_BranchId
        var branchId = Guid.NewGuid();
        var branch = new PSP.Domain.Modules.Branch.Entities.BranchEntity
        {
            Id = branchId,
            Name = "Test Branch",
            Code = "TB",
            Phone = "123",
            Address = "123",
            Status = PSP.Domain.Common.Enums.BranchStatus.Active
        };
        
        if (!context.Set<PSP.Domain.Modules.Branch.Entities.BranchEntity>().Any(b => b.Code == "TB"))
        {
            context.Set<PSP.Domain.Modules.Branch.Entities.BranchEntity>().Add(branch);
            context.SaveChanges();
        }
        else
        {
            branchId = context.Set<PSP.Domain.Modules.Branch.Entities.BranchEntity>().First(b => b.Code == "TB").Id;
        }

        // Seed user to satisfy FK_AuditLogs_Users_UserId
        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity 
        { 
            Id = _currentUserId, 
            Username = "testadmin", 
            FullName = "Test Admin", 
            PasswordHash = "hash",
            BranchId = branchId
        };
        if (!context.Set<PSP.Domain.Modules.Auth.Entities.UserEntity>().Any(u => u.Id == _currentUserId))
        {
            context.Set<PSP.Domain.Modules.Auth.Entities.UserEntity>().Add(user);
            context.SaveChanges();
        }
        
        return context;
    }

    private CustomerCommandHandlers CreateHandler(AppDbContext context)
    {
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(x => x.Repository<CustomerEntity>())
                      .Returns(new Repository<CustomerEntity>(context));
        unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
                      .Returns(() => context.SaveChangesAsync());
                      
        return new CustomerCommandHandlers(unitOfWorkMock.Object);
    }

    [Fact]
    public async Task T1_NormalUpdate_WithValidRowVersion_Succeeds()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);
        
        var customerId = Guid.NewGuid();
        var customer = new CustomerEntity { Id = customerId, FullName = "Old Name", Phone = "1111", Code = "C1" };
        context.Set<CustomerEntity>().Add(customer);
        await context.SaveChangesAsync();

        var dbCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        var rowVersion = dbCustomer.RowVersion;

        var command = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "New Name", 
            Phone = "1111", 
            RowVersion = rowVersion 
        };

        var result = await handler.Handle(command, CancellationToken.None);
        
        result.Should().BeTrue();
        var finalCustomer = await context.Set<CustomerEntity>().FirstAsync(c => c.Id == customerId);
        finalCustomer.FullName.Should().Be("New Name");
    }

    [Fact]
    public async Task T2_ConcurrentUpdate_WithStaleRowVersion_ThrowsConflictException()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);
        
        var customerId = Guid.NewGuid();
        var customer = new CustomerEntity { Id = customerId, FullName = "Old Name", Phone = "2222", Code = "C2" };
        context.Set<CustomerEntity>().Add(customer);
        await context.SaveChangesAsync();

        var dbCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        var staleRowVersion = dbCustomer.RowVersion;

        // Admin A updates
        var commandA = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "Admin A Name", 
            Phone = "2222", 
            RowVersion = staleRowVersion 
        };
        await handler.Handle(commandA, CancellationToken.None);

        // Admin B updates with stale RowVersion
        var commandB = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "Admin B Name", 
            Phone = "2222", 
            RowVersion = staleRowVersion 
        };

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandB, CancellationToken.None));
    }

    [Fact]
    public async Task T3_RewardPointsPreservation_ThrowsConflictExceptionWhenPointsChanged()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);
        
        var customerId = Guid.NewGuid();
        var customer = new CustomerEntity { Id = customerId, FullName = "Old Name", Phone = "3333", Code = "C3", RewardPoints = 0 };
        context.Set<CustomerEntity>().Add(customer);
        await context.SaveChangesAsync();

        var dbCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        var staleRowVersion = dbCustomer.RowVersion;

        // SalesOrder background process adds RewardPoints
        var bgCustomer = await context.Set<CustomerEntity>().FirstAsync(c => c.Id == customerId);
        bgCustomer.RewardPoints += 50;
        await context.SaveChangesAsync(); // This changes the DB RowVersion

        // Admin updates profile with stale RowVersion
        var commandAdmin = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "Admin Edit", 
            Phone = "3333", 
            RowVersion = staleRowVersion 
        };

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(commandAdmin, CancellationToken.None));
        
        // Assert RewardPoints were preserved
        var finalCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        finalCustomer.RewardPoints.Should().Be(50);
        finalCustomer.FullName.Should().Be("Old Name"); // Admin edit was blocked
    }

    [Fact]
    public async Task T4_ExactMillisecondCollision_TranslatesToConflictException()
    {
        await using var context = CreateDbContext();
        
        var customerId = Guid.NewGuid();
        var customer = new CustomerEntity { Id = customerId, FullName = "Old Name", Phone = "4444", Code = "C4" };
        context.Set<CustomerEntity>().Add(customer);
        await context.SaveChangesAsync();

        var dbCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        var rowVersion = dbCustomer.RowVersion;

        var command = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "Admin A Name", 
            Phone = "4444", 
            RowVersion = rowVersion 
        };

        // We mock the handler to pass the manual check, but fail at SaveChangesAsync
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var repoMock = new Mock<IRepository<CustomerEntity>>();
        
        repoMock.Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer); // Return the entity with matching RowVersion
            
        unitOfWorkMock.Setup(x => x.Repository<CustomerEntity>()).Returns(repoMock.Object);
        unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException());

        var handler = new CustomerCommandHandlers(unitOfWorkMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task T5_RegressionOfExistingCustomerBehavior_RemainIntact()
    {
        await using var context = CreateDbContext();
        var handler = CreateHandler(context);
        
        // 1. Create via DbContext directly (CreateCustomerCommand is not tested here, but we test the handler logic)
        var customerId = Guid.NewGuid();
        var customer = new CustomerEntity { Id = customerId, FullName = "Regression Name", Phone = "5555", Code = "C5" };
        context.Set<CustomerEntity>().Add(customer);
        await context.SaveChangesAsync();

        // 2. Fetch and assert
        var dbCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        dbCustomer.Should().NotBeNull();
        
        // 3. Update without conflict
        var command = new UpdateCustomerCommand 
        { 
            Id = customerId, 
            FullName = "Regression Name Updated", 
            Phone = "5555", 
            RowVersion = dbCustomer.RowVersion 
        };
        var result = await handler.Handle(command, CancellationToken.None);
        result.Should().BeTrue();
        
        // 4. Assert update
        var updatedCustomer = await context.Set<CustomerEntity>().AsNoTracking().FirstAsync(c => c.Id == customerId);
        updatedCustomer.FullName.Should().Be("Regression Name Updated");
        updatedCustomer.RowVersion.Should().NotBeEquivalentTo(dbCustomer.RowVersion);
    }
}
