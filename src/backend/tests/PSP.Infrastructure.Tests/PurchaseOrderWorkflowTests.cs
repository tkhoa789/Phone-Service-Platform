using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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

public class PurchaseOrderWorkflowTests
{
    private (AppDbContext, IUnitOfWork) CreateContextAndUnitOfWork()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.UserId).Returns(Guid.NewGuid().ToString());
        
        var context = new AppDbContext(options, mockUserService.Object);
        context.Database.OpenConnection();
        context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");
        context.Database.EnsureCreated();

        var unitOfWork = new UnitOfWork(context);
        return (context, unitOfWork);
    }

    [Fact]
    public async Task Complete_PurchaseOrder_Should_Increase_Inventory_And_Debt()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        
        // Arrange
        var handler = new PurchaseOrderCommandHandlers(unitOfWork, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var supplierId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var variantId = Guid.NewGuid();
        var poId = Guid.NewGuid();

        // Thêm dữ liệu mẫu
        context.Categories.Add(new CategoryEntity { Id = categoryId, Code = "MOBILE" });
        context.Products.Add(new ProductEntity { Id = productId, CategoryId = categoryId });
        context.ProductVariants.Add(new ProductVariantEntity { Id = variantId, ProductId = productId, RowVersion = new byte[] { 1 } });
        context.Suppliers.Add(new SupplierEntity { Id = supplierId, DebtAmount = 100000 });
        context.Warehouses.Add(new WarehouseEntity { Id = warehouseId, Code = "WH01" });

        var po = new PurchaseOrderEntity
        {
            Id = poId,
            SupplierId = supplierId,
            WarehouseId = warehouseId,
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = 500000,
            Code = "PO-001"
        };
        context.PurchaseOrders.Add(po);

        context.PurchaseOrderItems.Add(new PurchaseOrderItemEntity
        {
            PurchaseOrderId = poId,
            ProductVariantId = variantId,
            Quantity = 2,
            UnitPrice = 250000
        });

        await context.SaveChangesAsync();

        var command = new CompletePurchaseOrderCommand
        {
            Id = poId,
            RowVersion = po.RowVersion,
            VariantImeis = new List<ProductVariantImeisDto>
            {
                new ProductVariantImeisDto
                {
                    ProductVariantId = variantId,
                    Imeis = new List<string> { "IMEI123", "IMEI456" }
                }
            }
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        
        // Verify PO Status
        var updatedPo = await context.PurchaseOrders.FindAsync(poId);
        Assert.Equal(PurchaseOrderStatus.Received, updatedPo.Status);

        // Verify Inventory (Created)
        var inventory = await context.Inventories.FirstOrDefaultAsync(i => i.WarehouseId == warehouseId && i.ProductVariantId == variantId);
        Assert.NotNull(inventory);
        Assert.Equal(2, inventory.Quantity);

        // Verify IMEIs
        var imeis = await context.Imeis.Where(i => i.ProductVariantId == variantId).ToListAsync();
        Assert.Equal(2, imeis.Count);

        // Verify Supplier Debt
        var supplier = await context.Suppliers.FindAsync(supplierId);
        Assert.Equal(100000 + 500000, supplier.DebtAmount);

        // Verify Transactions
        var debtTxns = await context.SupplierDebtTransactions.Where(t => t.SupplierId == supplierId).ToListAsync();
        Assert.Single(debtTxns);
        Assert.Equal(500000, debtTxns[0].Amount);

        var invTxns = await context.InventoryTransactions.Where(t => t.WarehouseId == warehouseId).ToListAsync();
        Assert.Single(invTxns);
        Assert.Equal(2, invTxns[0].QuantityChange);
        Assert.Equal(InventoryTransactionType.IMPORT, invTxns[0].Type);
    }
    
    [Fact]
    public async Task Complete_PurchaseOrder_Should_Reject_If_Double_Called()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var handler = new PurchaseOrderCommandHandlers(unitOfWork, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);
        
        var poId = Guid.NewGuid();
        var po = new PurchaseOrderEntity
        {
            Id = poId,
            SupplierId = Guid.NewGuid(),
            WarehouseId = Guid.NewGuid(),
            Status = PurchaseOrderStatus.Received, // Already received
            TotalAmount = 500000,
            Code = "PO-002"
        };
        context.PurchaseOrders.Add(po);
        await context.SaveChangesAsync();
        
        var command = new CompletePurchaseOrderCommand { Id = poId, RowVersion = po.RowVersion };
        
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));
    }
}
