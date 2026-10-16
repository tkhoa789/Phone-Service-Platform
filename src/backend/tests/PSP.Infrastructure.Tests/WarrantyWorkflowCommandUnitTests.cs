using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Application.Modules.Warranty.Handlers;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class WarrantyWorkflowCommandUnitTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _branchId = Guid.NewGuid();
    private readonly Guid _customerId = Guid.NewGuid();
    private readonly Guid _salesOrderId = Guid.NewGuid();
    private readonly Guid _variantId = Guid.NewGuid();
    private readonly string _originalImei = "860123456789012";
    private readonly string _newImei = "860987654321098";

    public WarrantyWorkflowCommandUnitTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(x => x.UserId).Returns(_userId.ToString());
        _mockCurrentUserService.Setup(x => x.Username).Returns("tech_expert");
        _mockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
        _mockCurrentUserService.Setup(x => x.BranchId).Returns(_branchId.ToString());

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
        var user = new PSP.Domain.Modules.Auth.Entities.UserEntity { Id = _userId, FullName = "Tech Expert", Email = "tech@shop.vn", PasswordHash = "hash", BranchId = _branchId };
        var customer = new CustomerEntity { Id = _customerId, FullName = "Nguyễn Văn Test", Phone = "0988776655", Code = "CUST-001" };
        var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Điện thoại" };
        var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Apple" };
        var product = new ProductEntity { Id = Guid.NewGuid(), Name = "iPhone 15 Pro Max", CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariantEntity { Id = _variantId, ProductId = product.Id, Sku = "IP15PM-256-NAT", Name = "iPhone 15 Pro Max 256GB" };

        var salesOrder = new SalesOrderEntity
        {
            Id = _salesOrderId,
            CustomerId = _customerId,
            BranchId = _branchId,
            UserId = _userId,
            Status = SalesOrderStatus.Completed,
            Code = "HD-2026-001",
            CreatedAt = DateTime.UtcNow.AddMonths(-1)
        };

        var oldImeiEntity = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = _originalImei,
            ProductVariantId = _variantId,
            Status = ImeiStatus.WarrantyHold
        };

        var newImeiEntity = new ImeiEntity
        {
            Id = Guid.NewGuid(),
            Imei = _newImei,
            ProductVariantId = _variantId,
            Status = ImeiStatus.InStock
        };

        context.AddRange(branch, user, customer, category, brand, product, variant, salesOrder, oldImeiEntity, newImeiEntity);
        context.SaveChanges();
    }

    private WarrantyTicketEntity CreateTestTicket(AppDbContext context, WarrantyTicketStatus status = WarrantyTicketStatus.Received)
    {
        var ticket = new WarrantyTicketEntity
        {
            Id = Guid.NewGuid(),
            CustomerId = _customerId,
            SalesOrderId = _salesOrderId,
            ProductVariantId = _variantId,
            Imei = _originalImei,
            Code = "WAR-20260906-TEST01",
            Status = status,
            StartDate = DateTime.UtcNow,
            RowVersion = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 }
        };
        context.WarrantyTickets.Add(ticket);
        context.SaveChanges();
        return ticket;
    }

    public void Dispose()
    {
        _connection.Close();
    }

    [Fact]
    public async Task RejectWarranty_WithoutPaidRepair_UpdatesStatusToRejected_AndRecordsHistory()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new RejectWarrantyCommand(
            ticket.Id,
            RejectReason.WaterDamage,
            "Quỳ tím đổi màu đỏ tại khay sim và bo mạch chủ",
            "http://example.com/water_lci.jpg",
            false,
            ticket.RowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Rejected);
        updated.RejectReason.Should().Be(RejectReason.WaterDamage);
        updated.RejectNotes.Should().Be(command.RejectNotes);
        updated.TransferToPaidRepair.Should().BeFalse();
        updated.RepairTicketId.Should().BeNull();

        var histories = await context.WarrantyHistories.AsNoTracking().Where(h => h.WarrantyTicketId == ticket.Id).ToListAsync();
        histories.Should().HaveCount(1);
        histories[0].Action.Should().Be("Từ chối bảo hành");
        histories[0].Status.Should().Be("Rejected");
    }

    [Fact]
    public async Task RejectWarranty_WithTransferToPaidRepair_AutoCreatesRepairTicketInSameTransaction()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new RejectWarrantyCommand(
            ticket.Id,
            RejectReason.Dropped,
            "Vỡ kính cong sườn nặng do rơi",
            null,
            true, // Tư vấn chuyển sửa dịch vụ
            ticket.RowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Rejected);
        updated.TransferToPaidRepair.Should().BeTrue();
        updated.RepairTicketId.Should().NotBeNull();

        // Verify RepairTicket was created
        var repairTicket = await context.RepairTickets.AsNoTracking().FirstOrDefaultAsync(r => r.Id == updated.RepairTicketId);
        repairTicket.Should().NotBeNull();
        repairTicket!.CustomerId.Should().Be(ticket.CustomerId);
        repairTicket.WarrantyTicketId.Should().Be(ticket.Id);
        repairTicket.Status.Should().Be(RepairTicketStatus.Received);
        repairTicket.EstimatedCost.Should().Be(0);
        repairTicket.LaborCost.Should().Be(0);
    }

    [Fact]
    public async Task TransferToInHouseRepair_AutoCreatesRepairTicket_AndTransitionsTicketToProcessing()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new TransferToInHouseRepairCommand(
            ticket.Id,
            "Lỗi cụm FaceID chập chờn, cần thay linh kiện TrueDepth bảo hành",
            _userId,
            ticket.RowVersion
        );

        var repairTicketId = await handler.Handle(command, CancellationToken.None);

        repairTicketId.Should().NotBeEmpty();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Processing);
        updated.RepairTicketId.Should().Be(repairTicketId);

        var repair = await context.RepairTickets.AsNoTracking().FirstAsync(r => r.Id == repairTicketId);
        repair.WarrantyTicketId.Should().Be(ticket.Id);
        repair.Status.Should().Be(RepairTicketStatus.Received);
        repair.EstimatedCost.Should().Be(0);
        repair.ActualCost.Should().Be(0);
        repair.LaborCost.Should().Be(0);

        var histories = await context.WarrantyHistories.AsNoTracking().Where(h => h.WarrantyTicketId == ticket.Id).ToListAsync();
        histories.Should().HaveCount(1);
        histories[0].Action.Should().Be("Chuyển sửa chữa nội bộ");
    }

    [Fact]
    public async Task ReplaceDevice_SwapsImei_UpdatesInventory_AndCompletesWarranty()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new ReplaceDeviceCommand(
            ticket.Id,
            _newImei,
            "Lỗi bo mạch chính không nhận sóng, đủ điều kiện đổi mới 1-1 BR-905",
            ticket.RowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Completed);
        updated.Imei.Should().Be(_newImei);
        updated.EndDate.Should().NotBeNull();

        // Verify Old IMEI is Disposed
        var oldImei = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _originalImei);
        oldImei.Status.Should().Be(ImeiStatus.Disposed);

        // Verify New IMEI is Sold
        var newImei = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _newImei);
        newImei.Status.Should().Be(ImeiStatus.Sold);
        newImei.WarehouseId.Should().BeNull();
    }

    [Fact]
    public async Task ReplaceDevice_WhenNewImeiNotInStock_ThrowsBadRequest()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        // Non-existent IMEI
        var command = new ReplaceDeviceCommand(
            ticket.Id,
            "999999999999999",
            "Đổi máy",
            ticket.RowVersion
        );

        await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task SendToVendor_UpdatesVendorFields_AndSetsStatusProcessing()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new SendToVendorCommand(
            ticket.Id,
            "Trung tâm TTBH Apple Việt Nam",
            "OEM-RMA-889900",
            "VNPOST-TRACK-12345",
            "Gửi thẩm định màn hình OLED",
            ticket.RowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Processing);
        updated.VendorName.Should().Be(command.VendorName);
        updated.VendorTicketNumber.Should().Be(command.VendorTicketNumber);
        updated.TrackingNumber.Should().Be(command.TrackingNumber);
        updated.VendorSubStatus.Should().Be(VendorSubStatus.AtVendor);

        var histories = await context.WarrantyHistories.AsNoTracking().Where(h => h.WarrantyTicketId == ticket.Id).ToListAsync();
        histories.Should().HaveCount(1);
        histories[0].Action.Should().Be("Gửi hãng ủy quyền (OEM RMA)");
    }

    [Fact]
    public async Task DeliverToCustomer_WhenStatusProcessing_TransitionsToCompleted_AndRestoresImeiSold()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context, WarrantyTicketStatus.Processing);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new DeliverToCustomerCommand(
            ticket.Id,
            "Nguyễn Văn Test",
            "Máy đã sửa chữa hoàn tất, test full chức năng, bàn giao trả khách",
            ticket.RowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var updated = await context.WarrantyTickets.AsNoTracking().FirstAsync(x => x.Id == ticket.Id);
        updated.Status.Should().Be(WarrantyTicketStatus.Completed);
        updated.EndDate.Should().NotBeNull();

        // Verify IMEI returned to Sold
        var imei = await context.Imeis.AsNoTracking().FirstAsync(i => i.Imei == _originalImei);
        imei.Status.Should().Be(ImeiStatus.Sold);
    }

    [Fact]
    public async Task DeliverToCustomer_WhenStatusReceived_ThrowsBadRequest()
    {
        using var context = CreateDbContext();
        var ticket = CreateTestTicket(context, WarrantyTicketStatus.Received);
        var uow = new UnitOfWork(context);
        var handler = new WarrantyCommandHandlers(uow, currentUserService: _mockCurrentUserService.Object);

        var command = new DeliverToCustomerCommand(
            ticket.Id,
            "Nguyễn Văn Test",
            "Giao máy",
            ticket.RowVersion
        );

        // Cannot deliver when still Received
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Contain("Chỉ cho phép bàn giao trả khách khi phiếu bảo hành ở trạng thái Đang xử lý");
    }
}
