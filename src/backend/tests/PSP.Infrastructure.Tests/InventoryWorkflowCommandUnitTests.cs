using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class InventoryWorkflowCommandUnitTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IScopeContextService> _mockScopeContextService;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _branchId = Guid.NewGuid();
    private readonly Guid _warehouseId = Guid.NewGuid();
    private readonly Guid _variantId = Guid.NewGuid();
    private readonly string _testImei = "860123456789001";

    public InventoryWorkflowCommandUnitTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(x => x.UserId).Returns(_userId.ToString());
        _mockCurrentUserService.Setup(x => x.Username).Returns("inventory_manager");
        _mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        _mockCurrentUserService.Setup(x => x.BranchId).Returns(_branchId.ToString());

        _mockScopeContextService = new Mock<IScopeContextService>();

        using var context = CreateDbContext();
        context.Database.EnsureCreated();
        SeedDatabase(context);
    }

    private AppDbContext CreateDbContext()
    {
        return new AppDbContext(_options, _mockCurrentUserService.Object);
    }

    private void SeedDatabase(AppDbContext context)
    {
        var branch = new BranchEntity { Id = _branchId, Name = "Chi nhánh Quận 1" };
        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity
        {
            Id = _userId,
            FullName = "Inventory Manager",
            Email = "inv@shop.vn",
            PasswordHash = "hash",
            BranchId = _branchId
        };
        var warehouse = new WarehouseEntity { Id = _warehouseId, BranchId = _branchId, Code = "KHO-01", Name = "Kho Tổng Q1" };
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Điện thoại" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Apple" };
        var product = new ProductEntity { Id = Guid.NewGuid(), Name = "iPhone 15 Pro", CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariantEntity { Id = _variantId, ProductId = product.Id, Sku = "IP15P-128-BLK", Name = "iPhone 15 Pro 128GB" };

        var imei = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = _testImei,
            ProductVariantId = _variantId,
            WarehouseId = _warehouseId,
            Status = ImeiStatus.InStock
        };

        context.AddRange(branch, user, warehouse, category, brand, product, variant, imei);
        context.SaveChanges();
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenValidTransition_InStockToSold_Success()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "Sold");
        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _testImei);
        updated.Status.Should().Be(ImeiStatus.Sold);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenInvalidTransition_InStockToWarrantyHold_ThrowsBadRequest()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "WarrantyHold");

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await Assert.ThrowsAsync<BadRequestException>(act);
        ex.Message.Should().Contain("Không thể chuyển trạng thái IMEI");
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenInvalidTransition_SoldToInStock_ThrowsBadRequest()
    {
        using var context = CreateDbContext();
        var imei = await context.Imeis.FirstAsync(i => i.Imei == _testImei);
        imei.Status = ImeiStatus.Sold;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "InStock");

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await Assert.ThrowsAsync<BadRequestException>(act);
        ex.Message.Should().Contain("Không thể chuyển trạng thái IMEI");
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenCurrentIsDisposed_ThrowsBadRequestWithExactMessage()
    {
        using var context = CreateDbContext();
        var imei = await context.Imeis.FirstAsync(i => i.Imei == _testImei);
        imei.Status = ImeiStatus.Disposed;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "InStock");

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await Assert.ThrowsAsync<BadRequestException>(act);
        ex.Message.Should().Be("Thiết bị ở trạng thái thanh lý hoặc xuất hủy không thể chuyển sang trạng thái khác.");
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenCurrentIsWrittenOff_ThrowsBadRequestWithExactMessage()
    {
        using var context = CreateDbContext();
        var imei = await context.Imeis.FirstAsync(i => i.Imei == _testImei);
        imei.Status = ImeiStatus.WrittenOff;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "Sold");

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await Assert.ThrowsAsync<BadRequestException>(act);
        ex.Message.Should().Be("Thiết bị ở trạng thái thanh lý hoặc xuất hủy không thể chuyển sang trạng thái khác.");
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenValidTransition_RepairingToInStock_Success()
    {
        using var context = CreateDbContext();
        var imei = await context.Imeis.FirstAsync(i => i.Imei == _testImei);
        imei.Status = ImeiStatus.Repairing;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "InStock");
        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _testImei);
        updated.Status.Should().Be(ImeiStatus.InStock);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenValidTransition_WarrantyHoldToDisposed_Success()
    {
        using var context = CreateDbContext();
        var imei = await context.Imeis.FirstAsync(i => i.Imei == _testImei);
        imei.Status = ImeiStatus.WarrantyHold;
        await context.SaveChangesAsync();

        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "Disposed");
        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _testImei);
        updated.Status.Should().Be(ImeiStatus.Disposed);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenImeiNotFound_ThrowsNotFoundException()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand("999999999999999", "Sold");

        var act = () => handler.Handle(command, CancellationToken.None);
        await Assert.ThrowsAsync<NotFoundException>(act);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenInvalidStatusString_ThrowsBadRequestException()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "NonExistentStatus");

        var act = () => handler.Handle(command, CancellationToken.None);
        await Assert.ThrowsAsync<BadRequestException>(act);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenWhitespaceInImei_TrimsAndSucceeds()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);
        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, _mockScopeContextService.Object);

        var command = new UpdateImeiStatusCommand($"  {_testImei}  ", "Sold");
        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _testImei);
        updated.Status.Should().Be(ImeiStatus.Sold);
    }

    [Fact]
    public async Task UpdateImeiStatus_WhenUserLacksBranchAccess_ThrowsForbiddenException()
    {
        using var context = CreateDbContext();
        var uow = new UnitOfWork(context);

        var mockScope = new Mock<IScopeContextService>();
        mockScope.Setup(x => x.ValidateBranchAccess(_branchId, "IMEI"))
            .Throws(new ForbiddenException("Người dùng không có quyền truy cập dữ liệu của chi nhánh này."));

        var handler = new InventoryCommandHandlers(uow, _mockCurrentUserService.Object, mockScope.Object);

        var command = new UpdateImeiStatusCommand(_testImei, "Sold");

        var act = () => handler.Handle(command, CancellationToken.None);
        var ex = await Assert.ThrowsAsync<ForbiddenException>(act);
        ex.Message.Should().Contain("không có quyền truy cập");
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
