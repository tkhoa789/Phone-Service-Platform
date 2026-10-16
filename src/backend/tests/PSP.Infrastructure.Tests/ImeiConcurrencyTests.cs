using System;
using System.Linq;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Infrastructure.Data;
using Testcontainers.MsSql;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class ImeiConcurrencyTests : IAsyncLifetime
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

    [Fact]
    public async Task UpdateImeiStatus_ConcurrentUpdates_ThrowsDbUpdateConcurrencyException()
    {
        // Arrange
        using var setupContext = CreateDbContext();

        var branch = new PSP.Domain.Modules.Branch.Entities.BranchEntity { Id = Guid.NewGuid(), Name = "Branch 1" };
        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity { Id = _currentUserId, FullName = "Test", Email = "test@test.com", BranchId = branch.Id };
        var brand = new PSP.Domain.Modules.Product.Entities.BrandEntity { Id = Guid.NewGuid(), Name = "Brand 1" };
        var category = new PSP.Domain.Modules.Product.Entities.CategoryEntity { Id = Guid.NewGuid(), Name = "Cat" };
        var productBase = new ProductEntity { Id = Guid.NewGuid(), Name = "Base Phone", CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariantEntity { Id = Guid.NewGuid(), Sku = "SKU1", Name = "Variant1", ProductId = productBase.Id };
        
        var imei = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = "123456789012345",
            Status = ImeiStatus.InStock,
            ProductVariantId = variant.Id
        };
        
        setupContext.Branches.Add(branch);
        setupContext.Users.Add(user);
        setupContext.Brands.Add(brand);
        setupContext.Categories.Add(category);
        setupContext.Products.Add(productBase);
        setupContext.ProductVariants.Add(variant);
        setupContext.Imeis.Add(imei);
        await setupContext.SaveChangesAsync();

        // Act & Assert
        using var context1 = CreateDbContext();
        using var context2 = CreateDbContext();

        // Both contexts read the same IMEI at the same time
        var imei1 = await context1.Imeis.FirstAsync(i => i.Id == imei.Id);
        var imei2 = await context2.Imeis.FirstAsync(i => i.Id == imei.Id);

        // Context 1 updates the status to Repairing
        imei1.Status = ImeiStatus.Repairing;
        await context1.SaveChangesAsync(); // This should succeed

        // Context 2 tries to update the status to Sold
        imei2.Status = ImeiStatus.Sold;
        
        // This should fail because Context 1 already updated the RowVersion
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(async () => 
        {
            await context2.SaveChangesAsync();
        });
    }
}
