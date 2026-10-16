using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Infrastructure.Data;
using Testcontainers.MsSql;
using PSP.Application.Common.Interfaces;
using Moq;
using Xunit;
using PSP.Application.Modules.Sales.Commands;
using PSP.Application.Modules.Sales.Handlers;
using PSP.Domain.Common.Enums;
using MediatR;

namespace PSP.Infrastructure.Tests;

public class RealSqlServerTests : IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();
    
    private Guid _currentUserId = Guid.Empty;

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
        mockCurrentUserService.Setup(x => x.UserId).Returns(() => _currentUserId == Guid.Empty ? null : _currentUserId.ToString());
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        
        var context = new AppDbContext(options, mockCurrentUserService.Object);
        // Ensure database is created and migrations applied
        context.Database.Migrate();

        // Seed system admin user and apply schema patches to prevent missing columns
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'RewardPoints')
            BEGIN
                ALTER TABLE [Customers] ADD [RewardPoints] INT NOT NULL DEFAULT 0;
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'TotalSpent')
            BEGIN
                ALTER TABLE [Customers] ADD [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 0;
            END;

            IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '20000000-0000-0000-0000-000000000001')
            BEGIN
                INSERT INTO Branches (Id, Code, Name, Address, Phone, Email, Status, CreatedAt, UpdatedAt, IsDeleted) 
                VALUES ('00000000-0000-0000-0000-000000000001', 'HQ', 'HQ', 'Address', '0', 'e@e', 0, GETDATE(), GETDATE(), 0);

                INSERT INTO Users (Id, BranchId, Username, PasswordHash, FullName, Email, Phone, Status, CreatedAt, UpdatedAt, IsDeleted)
                VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin', 'hash', 'Admin', 'admin@psp', '099', 0, GETDATE(), GETDATE(), 0);
            END
        ");

        return context;
    }

    [Fact]
    public async Task ConcurrencyTest_ShouldThrowDbUpdateConcurrencyException_OnRaceCondition()
    {
        // 1. Arrange: Create database and seed initial data
        using var setupContext = CreateDbContext();
        var branch = new BranchEntity { Name = "Branch 1", Address = "123", Code = "BR01", Phone = "0123" };
        setupContext.Branches.Add(branch);
        await setupContext.SaveChangesAsync();

        var customer = new CustomerEntity { FullName = "Customer", Phone = "0999" };
        var category = new CategoryEntity { Name = "Cat 1" };
        var brand = new BrandEntity { Name = "Brand" };
        var product = new ProductEntity { Category = category, Brand = brand, Name = "Prod 1" };
        var variant = new ProductVariantEntity { Product = product, Name = "Var 1", Sku = "SKU1", SalePrice = 100 };
        var role = new RoleEntity { Name = "Admin", Description = "Admin" };
        var user = new UserEntity { Branch = branch, FullName = "Tech 1", Username = "user1", PasswordHash = "hash" };
        user.UserRoles.Add(new UserRoleEntity { Role = role, User = user });

        setupContext.Customers.Add(customer);
        setupContext.Categories.Add(category);
        setupContext.Brands.Add(brand);
        setupContext.Products.Add(product);
        setupContext.ProductVariants.Add(variant);
        setupContext.Roles.Add(role);
        setupContext.Users.Add(user);
        
        _currentUserId = user.Id;
        await setupContext.SaveChangesAsync();

        var ticket = new RepairTicketEntity
        {
            Code = "REP-001",
            CustomerId = customer.Id,
            ProductVariantId = variant.Id,
            ReceivedById = user.Id,
            BranchId = branch.Id,
            Status = PSP.Domain.Common.Enums.RepairTicketStatus.Received,
            ProblemDescription = "Broken screen"
        };
        setupContext.RepairTickets.Add(ticket);
        await setupContext.SaveChangesAsync();

        var ticketId = ticket.Id;

        // 2. Act: Simulate two concurrent contexts fetching the same ticket
        using var context1 = CreateDbContext();
        using var context2 = CreateDbContext();

        var ticket1 = await context1.RepairTickets.FindAsync(ticketId);
        var ticket2 = await context2.RepairTickets.FindAsync(ticketId);

        // Tech 1 changes status
        ticket1!.Status = PSP.Domain.Common.Enums.RepairTicketStatus.WaitingForParts;
        ticket1.ProblemDescription = "Updated by Tech 1";
        
        // Tech 2 changes status
        ticket2!.Status = PSP.Domain.Common.Enums.RepairTicketStatus.Repairing;
        ticket2.ProblemDescription = "Updated by Tech 2";

        // Tech 1 saves first -> SUCCESS
        await context1.SaveChangesAsync();

        // Tech 2 saves second -> FAILURE (Concurrency)
        Func<Task> act = async () => await context2.SaveChangesAsync();

        // 3. Assert: Tech 2 receives a DbUpdateConcurrencyException
        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();

        // 4. Assert Data Integrity: The database only contains Tech 1's changes
        using var verifyContext = CreateDbContext();
        var finalTicket = await verifyContext.RepairTickets.FindAsync(ticketId);
        finalTicket!.Status.Should().Be(PSP.Domain.Common.Enums.RepairTicketStatus.WaitingForParts);
        finalTicket.ProblemDescription.Should().Be("Updated by Tech 1");
    }

    [Fact]
    public async Task EmployeeTransferRegressionTest_ShouldKeepHistoricalTicketOwnership()
    {
        // Prove that moving an employee does not move the ticket
        using var setupContext = CreateDbContext();
        
        var branchA = new BranchEntity { Name = "Branch A", Address = "123", Code = "BRA", Phone = "0123" };
        var branchB = new BranchEntity { Name = "Branch B", Address = "456", Code = "BRB", Phone = "0456" };
        setupContext.Branches.AddRange(branchA, branchB);
        await setupContext.SaveChangesAsync();

        var customer = new CustomerEntity { FullName = "Customer", Phone = "0999" };
        var category = new CategoryEntity { Name = "Cat 1" };
        var brand = new BrandEntity { Name = "Brand" };
        var product = new ProductEntity { Category = category, Brand = brand, Name = "Prod 1" };
        var variant = new ProductVariantEntity { Product = product, Name = "Var 1", Sku = "SKU1", SalePrice = 100 };
        var role = new RoleEntity { Name = "Admin", Description = "Admin" };
        
        var employee = new UserEntity { Branch = branchA, FullName = "Employee E", Username = "user1", PasswordHash = "hash" };
        employee.UserRoles.Add(new UserRoleEntity { Role = role, User = employee });
        
        setupContext.Customers.Add(customer);
        setupContext.Categories.Add(category);
        setupContext.Brands.Add(brand);
        setupContext.Products.Add(product);
        setupContext.ProductVariants.Add(variant);
        setupContext.Roles.Add(role);
        setupContext.Users.Add(employee);
        
        _currentUserId = employee.Id;
        await setupContext.SaveChangesAsync();

        // Employee creates a ticket at Branch A
        var ticket = new RepairTicketEntity
        {
            Code = "REP-001",
            CustomerId = customer.Id,
            ProductVariantId = variant.Id,
            ReceivedById = employee.Id,
            BranchId = employee.BranchId, // Branch A
            Status = PSP.Domain.Common.Enums.RepairTicketStatus.Received,
            ProblemDescription = "Broken screen"
        };
        setupContext.RepairTickets.Add(ticket);
        await setupContext.SaveChangesAsync();

        // Employee transfers to Branch B
        employee.BranchId = branchB.Id;
        await setupContext.SaveChangesAsync();

        // Verification
        using var verifyContext = CreateDbContext();
        var retrievedTicket = await verifyContext.RepairTickets.Include(r => r.ReceivedBy).FirstOrDefaultAsync(r => r.Id == ticket.Id);
        
        // Assert ticket still belongs to Branch A
        retrievedTicket!.BranchId.Should().Be(branchA.Id);
        retrievedTicket.BranchId.Should().NotBe(branchB.Id);
        
        // Assert employee's current branch is Branch B
        retrievedTicket.ReceivedBy.BranchId.Should().Be(branchB.Id);
    }
}
