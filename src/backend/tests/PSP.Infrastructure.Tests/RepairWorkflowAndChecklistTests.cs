using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Repair.Commands;
using PSP.Application.Modules.Repair.Handlers;
using PSP.Domain.Common.Constants;
using PSP.Domain.Common.Enums;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Data.Repositories;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class RepairWorkflowAndChecklistTests
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
    public async Task UpdateRepairStatus_ValidTransitions_ShouldSucceed()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        
        // Arrange
        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(true);

        var handler = new RepairCommandHandlers(unitOfWork, mockUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var ticketId = Guid.NewGuid();
        var ticket = new RepairTicketEntity
        {
            Id = ticketId,
            CustomerId = Guid.NewGuid(),
            ProductVariantId = Guid.NewGuid(),
            ReceivedById = Guid.NewGuid(),
            Code = "REP-TEST",
            Status = RepairTicketStatus.Received
        };

        context.RepairTickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act & Assert
        // Received -> Diagnosing
        await handler.Handle(new UpdateRepairStatusCommand(ticketId, RepairTicketStatus.Diagnosing, null, null), CancellationToken.None);
        var t1 = await context.RepairTickets.FindAsync(ticketId);
        Assert.Equal(RepairTicketStatus.Diagnosing, t1.Status);

        // Diagnosing -> WaitingApproval
        await handler.Handle(new UpdateRepairStatusCommand(ticketId, RepairTicketStatus.WaitingApproval, null, null), CancellationToken.None);
        var t2 = await context.RepairTickets.FindAsync(ticketId);
        Assert.Equal(RepairTicketStatus.WaitingApproval, t2.Status);
    }

    [Fact]
    public async Task UpdateRepairStatus_InvalidTransition_ShouldThrowConflict()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(true);

        var handler = new RepairCommandHandlers(unitOfWork, mockUserService.Object, new Moq.Mock<PSP.Application.Common.Interfaces.IIdempotencyService>().Object);

        var ticketId = Guid.NewGuid();
        var ticket = new RepairTicketEntity
        {
            Id = ticketId,
            Code = "REP-TEST2",
            Status = RepairTicketStatus.WaitingApproval
        };

        context.RepairTickets.Add(ticket);
        await context.SaveChangesAsync();

        // WaitingApproval cannot go back to Diagnosing
        await Assert.ThrowsAsync<ConflictException>(() => 
            handler.Handle(new UpdateRepairStatusCommand(ticketId, RepairTicketStatus.Diagnosing, null, null), CancellationToken.None));
    }

    [Fact]
    public async Task CreateChecklist_WithExactly8Points_ShouldSucceed()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var branchId = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false);
        mockUserService.Setup(s => s.BranchId).Returns(branchId);
        mockUserService.Setup(s => s.UserId).Returns(userId);

        var ticketId = Guid.NewGuid();
        context.RepairTickets.Add(new RepairTicketEntity { Id = ticketId, ReceivedById = Guid.Parse(userId), Code = "R1" });
        context.Users.Add(new UserEntity { Id = Guid.Parse(userId), BranchId = Guid.Parse(branchId), Username = "u1" });
        await context.SaveChangesAsync();

        var handler = new RepairChecklistCommandHandlers(unitOfWork, mockUserService.Object);

        var items = new List<ChecklistItemDto>
        {
            new ChecklistItemDto { CheckPointName = "Display", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Touch", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "FaceID", IsPassed = false },
            new ChecklistItemDto { CheckPointName = "Camera", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Speakers", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Charging", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Wifi", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Body", IsPassed = true }
        };

        var result = await handler.Handle(new CreateRepairChecklistCommand(ticketId, RepairChecklistType.CheckIn, "Test", null, items), CancellationToken.None);
        
        Assert.NotEqual(Guid.Empty, result);
        var checklist = await context.RepairChecklists.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == result);
        Assert.NotNull(checklist);
        Assert.Equal(8, checklist.Items.Count);
    }

    [Fact]
    public async Task CreateChecklist_MissingPoints_ShouldThrowBadRequest()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var branchId = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false);
        mockUserService.Setup(s => s.BranchId).Returns(branchId);
        mockUserService.Setup(s => s.UserId).Returns(userId);

        var ticketId = Guid.NewGuid();
        context.RepairTickets.Add(new RepairTicketEntity { Id = ticketId, ReceivedById = Guid.Parse(userId), Code = "R1" });
        context.Users.Add(new UserEntity { Id = Guid.Parse(userId), BranchId = Guid.Parse(branchId), Username = "u1" });
        await context.SaveChangesAsync();

        var handler = new RepairChecklistCommandHandlers(unitOfWork, mockUserService.Object);

        var items = new List<ChecklistItemDto>
        {
            new ChecklistItemDto { CheckPointName = "Display", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Touch", IsPassed = true }
        }; // Missing 6 points

        await Assert.ThrowsAsync<BadRequestException>(() => 
            handler.Handle(new CreateRepairChecklistCommand(ticketId, RepairChecklistType.CheckIn, "Test", null, items), CancellationToken.None));
    }

    [Fact]
    public async Task CreateChecklist_WrongBranch_ShouldThrowForbidden()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var ticketBranchId = Guid.NewGuid();
        var userBranchId = Guid.NewGuid(); // Different branch
        var receivedUserId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false); // Not global admin
        mockUserService.Setup(s => s.BranchId).Returns(userBranchId.ToString());
        mockUserService.Setup(s => s.UserId).Returns(currentUserId.ToString());

        var ticketId = Guid.NewGuid();
        context.RepairTickets.Add(new RepairTicketEntity { Id = ticketId, ReceivedById = receivedUserId, Code = "R1" });
        context.Users.Add(new UserEntity { Id = receivedUserId, BranchId = ticketBranchId, Username = "u1" });
        await context.SaveChangesAsync();

        var handler = new RepairChecklistCommandHandlers(unitOfWork, mockUserService.Object);

        var items = new List<ChecklistItemDto>(); // It will fail at branch check before checking points

        await Assert.ThrowsAsync<ForbiddenException>(() => 
            handler.Handle(new CreateRepairChecklistCommand(ticketId, RepairChecklistType.CheckIn, "Test", null, items), CancellationToken.None));
    }

    [Fact]
    public async Task CreateChecklist_DuplicateType_DatabaseConstraintShouldReject()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var branchId = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false);
        mockUserService.Setup(s => s.BranchId).Returns(branchId);
        mockUserService.Setup(s => s.UserId).Returns(userId);

        var ticketId = Guid.NewGuid();
        context.RepairTickets.Add(new RepairTicketEntity { Id = ticketId, ReceivedById = Guid.Parse(userId), Code = "R2" });
        context.Users.Add(new UserEntity { Id = Guid.Parse(userId), BranchId = Guid.Parse(branchId), Username = "u2" });
        await context.SaveChangesAsync();

        var handler = new RepairChecklistCommandHandlers(unitOfWork, mockUserService.Object);

        var items = new List<ChecklistItemDto>
        {
            new ChecklistItemDto { CheckPointName = "Display", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Touch", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "FaceID", IsPassed = false },
            new ChecklistItemDto { CheckPointName = "Camera", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Speakers", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Charging", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Wifi", IsPassed = true },
            new ChecklistItemDto { CheckPointName = "Body", IsPassed = true }
        };

        // Create the first checklist successfully
        await handler.Handle(new CreateRepairChecklistCommand(ticketId, RepairChecklistType.CheckOut, "Test 1", null, items), CancellationToken.None);

        // Attempt to create a second checklist of the same type directly in the database (simulating a race condition bypassing the handler)
        var duplicateChecklist = new RepairChecklistEntity
        {
            RepairTicketId = ticketId,
            Type = RepairChecklistType.CheckOut, // Same type
            InspectorId = Guid.Parse(userId),
            InspectedAt = DateTime.UtcNow
        };
        context.RepairChecklists.Add(duplicateChecklist);

        // EF Core or SQLite should throw a DbUpdateException because of the unique constraint
        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    [Fact]
    public async Task CancelRepairTicket_WhenUserIsSales_AndTicketInRepairing_ShouldThrowForbiddenException()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var branchId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false);
        mockUserService.Setup(s => s.BranchId).Returns(branchId.ToString());
        mockUserService.Setup(s => s.UserId).Returns(userId.ToString());
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Sales)).Returns(true);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Owner)).Returns(false);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Admin)).Returns(false);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Manager)).Returns(false);

        var ticketId = Guid.NewGuid();
        var ticket = new RepairTicketEntity
        {
            Id = ticketId,
            BranchId = branchId,
            Code = "REP-SALES-TEST",
            Status = RepairTicketStatus.Repairing
        };
        context.RepairTickets.Add(ticket);
        await context.SaveChangesAsync();

        var mockIdempotency = new Mock<IIdempotencyService>();
        var handler = new RepairCommandHandlers(unitOfWork, mockUserService.Object, mockIdempotency.Object);

        var command = new CancelRepairTicketCommand(ticketId, "Khách không muốn sửa nữa", null);
        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CancelRepairTicket_WhenUserIsSales_AndTicketInReceived_ShouldSucceed()
    {
        var (context, unitOfWork) = CreateContextAndUnitOfWork();
        var branchId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(s => s.IsGlobalAdmin).Returns(false);
        mockUserService.Setup(s => s.BranchId).Returns(branchId.ToString());
        mockUserService.Setup(s => s.UserId).Returns(userId.ToString());
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Sales)).Returns(true);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Owner)).Returns(false);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Admin)).Returns(false);
        mockUserService.Setup(s => s.IsInRole(CanonicalRoles.Manager)).Returns(false);

        var ticketId = Guid.NewGuid();
        var ticket = new RepairTicketEntity
        {
            Id = ticketId,
            BranchId = branchId,
            Code = "REP-SALES-TEST-OK",
            Status = RepairTicketStatus.Received
        };
        context.RepairTickets.Add(ticket);
        await context.SaveChangesAsync();

        var mockIdempotency = new Mock<IIdempotencyService>();
        var handler = new RepairCommandHandlers(unitOfWork, mockUserService.Object, mockIdempotency.Object);

        var command = new CancelRepairTicketCommand(ticketId, "Khách mang máy về", null);
        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result);
        var updatedTicket = await context.RepairTickets.FindAsync(ticketId);
        Assert.NotNull(updatedTicket);
        Assert.Equal(RepairTicketStatus.Cancelled, updatedTicket.Status);
    }
}
