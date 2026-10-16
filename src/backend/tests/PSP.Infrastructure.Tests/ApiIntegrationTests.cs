using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Testcontainers.Redis;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using PSP.API;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Repair.Commands;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Infrastructure.Data;
using Testcontainers.MsSql;
using Xunit;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;

namespace PSP.Infrastructure.Tests
{
    public class FakePolicyEvaluator : IPolicyEvaluator
    {
        public Task<AuthenticateResult> AuthenticateAsync(AuthorizationPolicy policy, HttpContext context)
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] {
                new Claim(ClaimTypes.Name, "TestUser"),
                new Claim(ClaimTypes.Role, "Owner")
            }, "FakeScheme"));

            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal,
                new AuthenticationProperties(), "FakeScheme")));
        }

        public Task<PolicyAuthorizationResult> AuthorizeAsync(AuthorizationPolicy policy,
            AuthenticateResult authenticationResult, HttpContext context, object resource)
        {
            return Task.FromResult(PolicyAuthorizationResult.Success());
        }
    }

    public class CustomApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
            .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
            .WithPassword("Strong_Password_123!")
            .Build();

        private readonly RedisContainer _redisContainer = new RedisBuilder()
            .WithImage("redis:7.0-alpine")
            .Build();

        public Mock<ICurrentUserService> MockCurrentUserService { get; } = new Mock<ICurrentUserService>();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlServer(_msSqlContainer.GetConnectionString()));

                services.RemoveAll<ICurrentUserService>();
                services.AddSingleton<ICurrentUserService>(MockCurrentUserService.Object);

                services.AddSingleton<IPolicyEvaluator, FakePolicyEvaluator>();

                var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(StackExchange.Redis.IConnectionMultiplexer));
                if (redisDescriptor != null) services.Remove(redisDescriptor);

                services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
                    StackExchange.Redis.ConnectionMultiplexer.Connect(_redisContainer.GetConnectionString()));
            });
        }

        public async Task InitializeAsync()
        {
            await _msSqlContainer.StartAsync();
            await _redisContainer.StartAsync();
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await context.Database.MigrateAsync();
            
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'RewardPoints')
                BEGIN
                    ALTER TABLE [Customers] ADD [RewardPoints] INT NOT NULL DEFAULT 0;
                END;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'TotalSpent')
                BEGIN
                    ALTER TABLE [Customers] ADD [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 0;
                END;
            ");
        }

        public new async Task DisposeAsync()
        {
            await _msSqlContainer.DisposeAsync();
            await _redisContainer.DisposeAsync();
        }
    }

    public class ApiIntegrationTests : IClassFixture<CustomApiFactory>
    {
        private readonly CustomApiFactory _factory;
        private readonly HttpClient _client;
        private readonly Guid _currentUserId = Guid.NewGuid();
        private readonly Guid _currentBranchId = Guid.NewGuid();

        public ApiIntegrationTests(CustomApiFactory factory)
        {
            _factory = factory;
            _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(_currentUserId.ToString());
            _factory.MockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);
            _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(_currentBranchId.ToString());

            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
        }
        
        private async Task<(AppDbContext Context, RepairTicketEntity Ticket, RepairPartEntity Part, InventoryEntity Inventory)> SetupTestContextAsync()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            
            var category = new CategoryEntity { Id = Guid.NewGuid(), Name = "Cat", Code = "C" + Guid.NewGuid().ToString().Substring(0, 8) };
            var brand = new BrandEntity { Id = Guid.NewGuid(), Name = "Brand", Code = "B" + Guid.NewGuid().ToString().Substring(0, 8) };
            var productBase = new ProductEntity { Id = Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id, Name = "Base", Code = "P" + Guid.NewGuid().ToString().Substring(0, 8) };
            var warehouse = new WarehouseEntity { Id = Guid.NewGuid(), Name = "WH", BranchId = _currentBranchId, Code = "W" + Guid.NewGuid().ToString().Substring(0, 8) };
            var branch = new BranchEntity { Id = _currentBranchId, Name = "Branch" };

            var product = new ProductVariantEntity { Id = Guid.NewGuid(), ProductId = productBase.Id, Name = "Screen", SalePrice = 100, Sku = "SKU" + Guid.NewGuid().ToString().Substring(0, 8) };
            var user = new UserEntity { Id = _currentUserId, FullName = "Tech", Email = "tech" + Guid.NewGuid().ToString().Substring(0, 8) + "@test.com", BranchId = _currentBranchId };
            var customer = new CustomerEntity { Id = Guid.NewGuid(), FullName = "Cus", Phone = Guid.NewGuid().ToString().Substring(0, 10), Code = "CUS" + Guid.NewGuid().ToString().Substring(0, 8) };
            var ticket = new RepairTicketEntity { Id = Guid.NewGuid(), Code = "T" + Guid.NewGuid().ToString().Substring(0, 4), BranchId = branch.Id, ReceivedById = user.Id, Status = RepairTicketStatus.Repairing, CustomerId = customer.Id, ProductVariantId = product.Id };
            
            var inventory = new InventoryEntity { Id = Guid.NewGuid(), WarehouseId = warehouse.Id, ProductVariantId = product.Id, Quantity = 10 };
            
            var part = new RepairPartEntity 
            { 
                Id = Guid.NewGuid(), 
                RepairTicketId = ticket.Id, 
                ProductVariantId = product.Id, 
                Quantity = 1, 
                Status = RepairPartStatus.Reserved,
                UnitPrice = 50
            };

            context.Categories.Add(category);
            context.Brands.Add(brand);
            context.Products.Add(productBase);
            context.Warehouses.Add(warehouse);
            context.Branches.Add(branch);
            context.ProductVariants.Add(product);
            context.Users.Add(user);
            context.Customers.Add(customer);
            context.RepairTickets.Add(ticket);
            context.Inventories.Add(inventory);
            context.RepairParts.Add(part);

            await context.SaveChangesAsync();

            return (context, ticket, part, inventory);
        }

        [Fact]
        public async Task API_IssuePart_Success_Returns200()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, part.RowVersion);
            
            var response = await _client.PutAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/status", command);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            using var scope = _factory.Services.CreateScope();
            var assertContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updatedPart = await assertContext.RepairParts.FindAsync(part.Id);
            updatedPart.Status.Should().Be(RepairPartStatus.Issued);
        }

        [Fact]
        public async Task API_InvalidTransition_Returns409()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Installed, part.RowVersion);
            var response = await _client.PutAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/status", command);
            response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task API_ReturnPart_Success_Returns200()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            part.Status = RepairPartStatus.Issued;
            await context.SaveChangesAsync();

            var command = new ReturnRepairPartCommand(ticket.Id, part.Id, part.RowVersion);
            var response = await _client.PostAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/return", command);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task API_WriteOffPart_Success_Returns200()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            part.Status = RepairPartStatus.Issued;
            await context.SaveChangesAsync();

            var command = new WriteOffRepairPartCommand(ticket.Id, part.Id, "Lost", part.RowVersion);
            var response = await _client.PostAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/writeoff", command);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task API_CancelTicket_WithDispositions_Returns200()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            part.Status = RepairPartStatus.Issued;
            await context.SaveChangesAsync();

            var disp = new RepairPartDispositionDto(part.Id, RepairPartStatus.WriteOff, "Cancel and write-off");
            var command = new CancelRepairTicketCommand(ticket.Id, "Cancel test", new List<RepairPartDispositionDto> { disp });
            
            var response = await _client.PostAsJsonAsync($"/api/RepairTicket/{ticket.Id}/cancel", command);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        
        [Fact]
        public async Task API_ConcurrentRequest_Returns409()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            var command = new UpdateRepairPartStatusCommand(ticket.Id, part.Id, RepairPartStatus.Issued, part.RowVersion);
            
            var response1 = await _client.PutAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/status", command);
            response1.StatusCode.Should().Be(HttpStatusCode.OK);

            var response2 = await _client.PutAsJsonAsync($"/api/RepairTicket/{ticket.Id}/part/{part.Id}/status", command);
            response2.StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task API_UpdateStatus_ToCancelled_WithNoIssuedParts_BackwardCompatibility_Returns200()
        {
            var (context, ticket, part, _) = await SetupTestContextAsync();
            
            var command = new UpdateRepairStatusCommand(ticket.Id, RepairTicketStatus.Cancelled, "Legacy Cancel", null);
            _client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
            var response = await _client.PutAsJsonAsync($"/api/RepairTicket/{ticket.Id}/status", command);
            
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            using var scope = _factory.Services.CreateScope();
            var assertContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updatedTicket = await assertContext.RepairTickets.FindAsync(ticket.Id);
            updatedTicket.Status.Should().Be(RepairTicketStatus.Cancelled);
        }


    }
}
