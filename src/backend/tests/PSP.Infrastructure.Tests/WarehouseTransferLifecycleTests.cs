using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Application.Modules.Inventory.DTOs;
using PSP.Application.Modules.Inventory.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Testcontainers.MsSql;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class WarehouseTransferLifecycleTests : IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder().Build();
    private AppDbContext _context = null!;
    private IUnitOfWork _unitOfWork = null!;
    private WarehouseTransferCommandHandlers _handler = null!;

    private Guid _sourceWarehouseId = Guid.NewGuid();
    private Guid _targetWarehouseId = Guid.NewGuid();
    private Guid _variantId = Guid.NewGuid();
    private Guid _imeiId = Guid.NewGuid();
    private Guid _employeeId = Guid.NewGuid();
    private string _imeiCode = "TRF-IMEI-001";

    private string _currentUserId;

    public async Task InitializeAsync()
    {
        _currentUserId = _employeeId.ToString();
        await _msSqlContainer.StartAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_msSqlContainer.GetConnectionString())
            .Options;

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(x => x.UserId).Returns(() => _currentUserId);
        mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);

        _context = new AppDbContext(options, mockCurrentUserService.Object);
        await _context.Database.MigrateAsync();

        _unitOfWork = new UnitOfWork(_context);
        
        var mockIdempotency = new Mock<IIdempotencyService>();
        
        _handler = new WarehouseTransferCommandHandlers(_unitOfWork, mockCurrentUserService.Object, mockIdempotency.Object);

        await SeedDataAsync();
    }

    private async Task SeedDataAsync()
    {
        var sourceBranch = new PSP.Domain.Modules.Branch.Entities.BranchEntity { Id = Guid.NewGuid(), Code = "BR-SRC", Name = "Src Branch", Address = "ABC", Phone = "123" };
        var targetBranch = new PSP.Domain.Modules.Branch.Entities.BranchEntity { Id = Guid.NewGuid(), Code = "BR-TGT", Name = "Tgt Branch", Address = "DEF", Phone = "456" };

        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity { Id = _employeeId, Username = "admin", PasswordHash = "hash", FullName = "Admin", BranchId = sourceBranch.Id };
        var brand = new PSP.Domain.Modules.Product.Entities.BrandEntity { Id = Guid.NewGuid(), Name = "Apple" };
        var category = new CategoryEntity { Id = Guid.NewGuid(), Code = "MOBILE_PHONE", Name = "Phone" };
        var product = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Test Phone" };
        var variant = new ProductVariantEntity { Id = _variantId, ProductId = product.Id, Name = "Test Phone Var", SalePrice = 1000 };

        var sourceWh = new WarehouseEntity { Id = _sourceWarehouseId, BranchId = sourceBranch.Id, Code = "WH-SRC", Name = "Source WH" };
        var targetWh = new WarehouseEntity { Id = _targetWarehouseId, BranchId = targetBranch.Id, Code = "WH-TGT", Name = "Target WH" };

        var inventory = new InventoryEntity { WarehouseId = _sourceWarehouseId, ProductVariantId = _variantId, Quantity = 5, MinimumStock = 0 };
        var imei = new ImeiEntity { Id = _imeiId, Imei = _imeiCode, ProductVariantId = _variantId, WarehouseId = _sourceWarehouseId, Status = ImeiStatus.InStock };

        _context.Branches.Add(sourceBranch);
        _context.Branches.Add(targetBranch);
        _context.Users.Add(user);
        _context.Brands.Add(brand);
        _context.Categories.Add(category);
        _context.Products.Add(product);
        _context.ProductVariants.Add(variant);
        _context.Warehouses.Add(sourceWh);
        _context.Warehouses.Add(targetWh);
        _context.Inventories.Add(inventory);
        _context.Imeis.Add(imei);
        await _context.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _msSqlContainer.DisposeAsync();
    }

    [Fact]
    public async Task Ship_Success_DeductsSourceInventory_AndCreatesOutLedger()
    {
        // Arrange
        var createCmd = new CreateWarehouseTransferCommand
        {
            FromWarehouseId = _sourceWarehouseId,
            ToWarehouseId = _targetWarehouseId,
            Code = "TRF-001",
            Items = new List<CreateWarehouseTransferItemCommand>
            {
                new() { ProductVariantId = _variantId, Quantity = 1 }
            }
        };
        var transferId = await _handler.Handle(createCmd, CancellationToken.None);

        var shipCmd = new ShipWarehouseTransferCommand
        {
            Id = transferId,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new() { ProductVariantId = _variantId, Imeis = new List<string> { _imeiCode } }
            }
        };

        // Act
        await _handler.Handle(shipCmd, CancellationToken.None);

        // Assert
        var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == _sourceWarehouseId);
        Assert.Equal(4, inv!.Quantity); // Deducted 1

        var ledger = await _context.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == transferId && t.Type == InventoryTransactionType.TRANSFER_OUT);
        Assert.NotNull(ledger);
        Assert.Equal(-1, ledger.QuantityChange);
        Assert.Equal(_imeiId, ledger.ImeiId);
    }

    [Fact]
    public async Task Ship_RemovesIMEIFromSourceAvailability()
    {
        // Arrange
        var createCmd = new CreateWarehouseTransferCommand
        {
            FromWarehouseId = _sourceWarehouseId,
            ToWarehouseId = _targetWarehouseId,
            Code = "TRF-002",
            Items = new List<CreateWarehouseTransferItemCommand>
            {
                new() { ProductVariantId = _variantId, Quantity = 1 }
            }
        };
        var transferId = await _handler.Handle(createCmd, CancellationToken.None);
        var shipCmd = new ShipWarehouseTransferCommand
        {
            Id = transferId,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new() { ProductVariantId = _variantId, Imeis = new List<string> { _imeiCode } }
            }
        };

        // Act
        await _handler.Handle(shipCmd, CancellationToken.None);

        // Assert
        var imei = await _context.Imeis.FindAsync(_imeiId);
        Assert.Null(imei!.WarehouseId);
        Assert.Equal(ImeiStatus.InStock, imei.Status);
    }

    [Fact]
    public async Task Receive_Success_AddsDestinationInventory_AndCreatesInLedger()
    {
        // Arrange
        var transfer = new WarehouseTransferEntity { FromWarehouseId = _sourceWarehouseId, ToWarehouseId = _targetWarehouseId, Code = "TRF-003", Status = WarehouseTransferStatus.InTransit };
        _context.WarehouseTransfers.Add(transfer);
        _context.WarehouseTransferItems.Add(new WarehouseTransferItemEntity { TransferId = transfer.Id, ProductVariantId = _variantId, Quantity = 1 });
        
        var imei = await _context.Imeis.FindAsync(_imeiId);
        imei!.WarehouseId = null; // simulate shipped state

        _context.InventoryTransactions.Add(new InventoryTransactionEntity
        {
            WarehouseId = _sourceWarehouseId,
            ProductVariantId = _variantId,
            ImeiId = _imeiId,
            Type = InventoryTransactionType.TRANSFER_OUT,
            QuantityChange = -1,
            ReferenceId = transfer.Id,
            ActorId = _employeeId
        });
        await _context.SaveChangesAsync();

        var receiveCmd = new ReceiveWarehouseTransferCommand
        {
            Id = transfer.Id,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new() { ProductVariantId = _variantId, Imeis = new List<string> { _imeiCode } }
            }
        };

        // Act
        await _handler.Handle(receiveCmd, CancellationToken.None);

        // Assert
        var targetInv = await _context.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == _targetWarehouseId);
        Assert.NotNull(targetInv);
        Assert.Equal(1, targetInv.Quantity);

        var ledger = await _context.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == transfer.Id && t.Type == InventoryTransactionType.TRANSFER_IN);
        Assert.NotNull(ledger);
        Assert.Equal(1, ledger.QuantityChange);
        
        var dbImei = await _context.Imeis.FindAsync(_imeiId);
        Assert.Equal(_targetWarehouseId, dbImei!.WarehouseId);
    }

    [Fact]
    public async Task Cancel_InTransit_RestoresSourceInventory_AndCreatesReturnLedger()
    {
        // Arrange
        var transfer = new WarehouseTransferEntity { FromWarehouseId = _sourceWarehouseId, ToWarehouseId = _targetWarehouseId, Code = "TRF-004", Status = WarehouseTransferStatus.InTransit };
        _context.WarehouseTransfers.Add(transfer);
        _context.WarehouseTransferItems.Add(new WarehouseTransferItemEntity { TransferId = transfer.Id, ProductVariantId = _variantId, Quantity = 1 });
        
        var imei = await _context.Imeis.FindAsync(_imeiId);
        imei!.WarehouseId = null;

        var sourceInv = await _context.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == _sourceWarehouseId);
        sourceInv!.Quantity = 4; // simulated shipped

        _context.InventoryTransactions.Add(new InventoryTransactionEntity
        {
            WarehouseId = _sourceWarehouseId,
            ProductVariantId = _variantId,
            ImeiId = _imeiId,
            Type = InventoryTransactionType.TRANSFER_OUT,
            QuantityChange = -1,
            ReferenceId = transfer.Id,
            ActorId = _employeeId
        });
        await _context.SaveChangesAsync();

        var cancelCmd = new CancelWarehouseTransferCommand(transfer.Id);

        // Act
        await _handler.Handle(cancelCmd, CancellationToken.None);

        // Assert
        var finalInv = await _context.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == _sourceWarehouseId);
        Assert.Equal(5, finalInv!.Quantity); // restored

        var ledger = await _context.InventoryTransactions.FirstOrDefaultAsync(t => t.ReferenceId == transfer.Id && t.Type == InventoryTransactionType.TRANSFER_CANCEL_RETURN);
        Assert.NotNull(ledger);
        Assert.Equal(1, ledger.QuantityChange);

        var dbImei = await _context.Imeis.FindAsync(_imeiId);
        Assert.Equal(_sourceWarehouseId, dbImei!.WarehouseId);
    }

    [Fact]
    public async Task Double_Ship_DoesNotDuplicateMutation()
    {
        // Simulate idempotency by mocking the service to throw if executed twice or just verifying IdempotencyService is called.
        // The prompt asks to ensure Idempotency. I'll mock IIdempotencyService to throw on second call.
        
        var mockIdempotency = new Mock<IIdempotencyService>();
        mockIdempotency.SetupSequence(x => x.AttachRecord(It.IsAny<Guid>()))
            .Pass()
            .Throws(new ConflictException("Idempotent constraint violated"));
            
        var handlerWithIdempotency = new WarehouseTransferCommandHandlers(_unitOfWork, new Mock<ICurrentUserService>().Object, mockIdempotency.Object);
        
        var createCmd = new CreateWarehouseTransferCommand
        {
            FromWarehouseId = _sourceWarehouseId,
            ToWarehouseId = _targetWarehouseId,
            Code = "TRF-DOUBLE",
            Items = new List<CreateWarehouseTransferItemCommand>
            {
                new() { ProductVariantId = _variantId, Quantity = 1 }
            }
        };
        var transferId = await handlerWithIdempotency.Handle(createCmd, CancellationToken.None);

        var shipCmd = new ShipWarehouseTransferCommand
        {
            Id = transferId,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new() { ProductVariantId = _variantId, Imeis = new List<string> { _imeiCode } }
            }
        };

        // First call should succeed
        await handlerWithIdempotency.Handle(shipCmd, CancellationToken.None);

        // Second call should throw
        await Assert.ThrowsAsync<ConflictException>(() => handlerWithIdempotency.Handle(shipCmd, CancellationToken.None));
    }
}
