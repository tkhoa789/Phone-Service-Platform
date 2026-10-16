using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Sales.Commands;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Infrastructure.Data;
using PSP.Infrastructure.Services.Auth;
using StackExchange.Redis;
using Testcontainers.MsSql;
using Testcontainers.Redis;
using Xunit;
using Xunit.Abstractions;

namespace PSP.Infrastructure.Tests;

public class IdempotencyIntegrationTests : IClassFixture<IdempotencyIntegrationTests.IdempotencyApiFactory>
{
    private readonly IdempotencyApiFactory _factory;
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public IdempotencyIntegrationTests(IdempotencyApiFactory factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
        _client = _factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "fake-token");
    }

    private class TestData
    {
        public Guid UserId { get; set; }
        public Guid BranchId { get; set; }
        public CustomerEntity Customer { get; set; }
        public ProductVariantEntity Variant { get; set; }
        public InventoryEntity Inventory { get; set; }
        public CreateSalesOrderCommand Command { get; set; }
    }

    private async Task<TestData> SetupTestDataAsync(Guid? branchId = null, Guid? userId = null, string suffix = "")
    {
        if (suffix.Length > 5) suffix = suffix.Substring(0, 5);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var bId = branchId ?? Guid.NewGuid();
        var uId = userId ?? Guid.NewGuid();

        _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(uId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(bId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.IsGlobalAdmin).Returns(true);

        var branch = await db.Branches.FindAsync(bId);
        if (branch == null) {
            branch = new BranchEntity { Id = bId, Name = "Branch" + suffix, Code = "BR" + suffix };
            db.Branches.Add(branch);
        }
        
        var user = await db.Users.FindAsync(uId);
        if (user == null) {
            var role = new RoleEntity { Name = "Sales" + suffix };
            db.Roles.Add(role);
            user = new UserEntity { Id = uId, Username = "sales" + suffix, FullName = "Sales", BranchId = bId, Email = "sales" + suffix + "@test.com" };
            db.Users.Add(user);
            db.UserRoles.Add(new UserRoleEntity { UserId = user.Id, RoleId = role.Id });
        }
        
        var customer = new CustomerEntity { FullName = "John" + suffix, Phone = "12345" + suffix, Code = "CUST" + suffix };
        db.Customers.Add(customer);

        var brand = new BrandEntity { Name = "Apple" + suffix, Code = "BRD" + suffix };
        db.Brands.Add(brand);

        var category = new CategoryEntity { Name = "Phone" + suffix, Code = "CAT" + suffix };
        db.Categories.Add(category);

        var product = new ProductEntity { Name = "Phone" + suffix, BrandId = brand.Id, CategoryId = category.Id, Code = "PROD" + suffix };
        db.Products.Add(product);

        var variant = new ProductVariantEntity { ProductId = product.Id, Sku = "SKU" + suffix, SalePrice = 1000 };
        db.ProductVariants.Add(variant);

        var warehouse = new WarehouseEntity { Name = "Main" + suffix, BranchId = branch.Id, Code = "WH" + suffix };
        db.Warehouses.Add(warehouse);

        var inventory = new InventoryEntity { ProductVariantId = variant.Id, WarehouseId = warehouse.Id, Quantity = 10 };
        db.Inventories.Add(inventory);

        await db.SaveChangesAsync();

        var command = new CreateSalesOrderCommand(
            customer.Id,
            null,
            new List<CreateSalesOrderItemCommand>
            {
                new CreateSalesOrderItemCommand(variant.Id, null, 1)
            }
        );

        return new TestData 
        { 
            UserId = uId, 
            BranchId = bId, 
            Customer = customer, 
            Variant = variant, 
            Inventory = inventory,
            Command = command
        };
    }

    [Fact]
    public async Task CrashAfterCommit_ShouldReturnSavedResponse_AndNotDuplicateLedger()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data.Command);

        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();

        var body1 = await response1.Content.ReadAsStringAsync();
        var result1 = JsonSerializer.Deserialize<JsonElement>(body1);
        var orderId = result1.GetProperty("data").GetString();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var redis = scope.ServiceProvider.GetRequiredService<IConnectionMultiplexer>().GetDatabase();
        
        var identityKey = $"idempotency:{data.UserId}:{data.BranchId}:{idempotencyKey}";
        await redis.StringSetAsync(identityKey, "IN_PROGRESS");

        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data.Command);

        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();
        var body2 = await response2.Content.ReadAsStringAsync();
        var result2 = JsonSerializer.Deserialize<JsonElement>(body2);
        var orderId2 = result2.GetProperty("data").GetString();

        Assert.Equal(orderId, orderId2);
        var invQuantity2 = await db.Inventories.Where(x => x.Id == data.Inventory.Id).Select(x => x.Quantity).FirstAsync();
        Assert.Equal(10, invQuantity2);
    }

    [Fact]
    public async Task A_SameKeySamePayload_ShouldReturn200Twice_ButCreate1Order()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data.Command);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();
        var body1 = await response1.Content.ReadAsStringAsync();

        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data.Command);
        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();
        var body2 = await response2.Content.ReadAsStringAsync();

        var orderId1 = JsonSerializer.Deserialize<JsonElement>(body1).GetProperty("data").GetString();
        var orderId2 = JsonSerializer.Deserialize<JsonElement>(body2).GetProperty("data").GetString();
        Assert.Equal(orderId1, orderId2);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var orderCount = await db.SalesOrders.CountAsync(x => x.CustomerId == data.Customer.Id);
        Assert.Equal(1, orderCount);
    }

    [Fact]
    public async Task B_SameKeyDifferentPayload_ShouldReturn409()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data.Command);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();

        var differentCommand = new CreateSalesOrderCommand(data.Customer.Id, null, new List<CreateSalesOrderItemCommand> { new CreateSalesOrderItemCommand(data.Variant.Id, null, 2) });
        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(differentCommand);
        
        var response2 = await _client.SendAsync(request2);
        Assert.Equal(HttpStatusCode.Conflict, response2.StatusCode);
    }

    [Fact]
    public async Task C_SameKeyDifferentUserId_ShouldCreateIndependent()
    {
        var branchId = Guid.NewGuid();
        var data1 = await SetupTestDataAsync(branchId: branchId, suffix: Guid.NewGuid().ToString("N"));
        var data2 = await SetupTestDataAsync(branchId: branchId, suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(data1.UserId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(branchId.ToString());
        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data1.Command);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();

        _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(data2.UserId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(branchId.ToString());
        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data2.Command);
        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.SalesOrders.CountAsync(x => x.CustomerId == data1.Customer.Id || x.CustomerId == data2.Customer.Id);
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task D_SameKeyDifferentBranchId_ShouldCreateIndependent()
    {
        var data1 = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var data2 = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(data1.UserId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(data1.BranchId.ToString());
        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data1.Command);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();

        _factory.MockCurrentUserService.Setup(x => x.UserId).Returns(data2.UserId.ToString());
        _factory.MockCurrentUserService.Setup(x => x.BranchId).Returns(data2.BranchId.ToString());
        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data2.Command);
        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.SalesOrders.CountAsync(x => x.CustomerId == data1.Customer.Id || x.CustomerId == data2.Customer.Id);
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task E_ConcurrentIdenticalRequests_Only1TransactionCommitted()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var tasks = new List<Task<HttpResponseMessage>>();
        for(int i = 0; i < 5; i++)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
            request.Headers.Add("Idempotency-Key", idempotencyKey);
            request.Content = JsonContent.Create(data.Command);
            tasks.Add(_factory.CreateClient().SendAsync(request));
        }

        var responses = await Task.WhenAll(tasks);
        var successCount = responses.Count(r => r.IsSuccessStatusCode);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(5, successCount + conflictCount);
        Assert.True(successCount >= 1, "At least one request must succeed");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var orderCount = await db.SalesOrders.CountAsync(x => x.CustomerId == data.Customer.Id);
        Assert.Equal(1, orderCount);
    }

    [Fact]
    public async Task G_DbTransactionRollback_ShouldExecuteAgain()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var badCommand = new CreateSalesOrderCommand(data.Customer.Id, null, new List<CreateSalesOrderItemCommand> { new CreateSalesOrderItemCommand(Guid.NewGuid(), null, 1) });
        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(badCommand);
        var response1 = await _client.SendAsync(request1);
        Assert.False(response1.IsSuccessStatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var inv = await db.Inventories.FindAsync(data.Inventory.Id);
            inv.Quantity = 0;
            await db.SaveChangesAsync();
        }

        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data.Command);
        var response2 = await _client.SendAsync(request2);
        Assert.False(response2.IsSuccessStatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var inv = await db.Inventories.FindAsync(data.Inventory.Id);
            inv.Quantity = 10;
            await db.SaveChangesAsync();
        }

        var request3 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request3.Headers.Add("Idempotency-Key", idempotencyKey);
        request3.Content = JsonContent.Create(data.Command);
        var response3 = await _client.SendAsync(request3);
        response3.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task I_RedisInProgress_NoDbRecord_ShouldReturn409()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        using var scope = _factory.Services.CreateScope();
        var redis = scope.ServiceProvider.GetRequiredService<IConnectionMultiplexer>().GetDatabase();
        var identityKey = $"idempotency:{data.UserId}:{data.BranchId}:{idempotencyKey}";
        
        await redis.StringSetAsync(identityKey, "IN_PROGRESS");

        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data.Command);

        var response1 = await _client.SendAsync(request1);
        Assert.Equal(HttpStatusCode.Conflict, response1.StatusCode);
    }

    [Fact]
    public async Task K_RedisCompletedCacheHit_ShouldReturnCachedResponse()
    {
        var data = await SetupTestDataAsync(suffix: Guid.NewGuid().ToString("N"));
        var idempotencyKey = Guid.NewGuid().ToString();

        var request1 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request1.Headers.Add("Idempotency-Key", idempotencyKey);
        request1.Content = JsonContent.Create(data.Command);
        var response1 = await _client.SendAsync(request1);
        response1.EnsureSuccessStatusCode();
        var body1 = await response1.Content.ReadAsStringAsync();

        var request2 = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request2.Headers.Add("Idempotency-Key", idempotencyKey);
        request2.Content = JsonContent.Create(data.Command);
        var response2 = await _client.SendAsync(request2);
        response2.EnsureSuccessStatusCode();
        var body2 = await response2.Content.ReadAsStringAsync();

        var orderId1 = JsonSerializer.Deserialize<JsonElement>(body1).GetProperty("data").GetString();
        var orderId2 = JsonSerializer.Deserialize<JsonElement>(body2).GetProperty("data").GetString();
        Assert.Equal(orderId1, orderId2);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var orderCount = await db.SalesOrders.CountAsync(x => x.CustomerId == data.Customer.Id);
        Assert.Equal(1, orderCount);
    }

    [Fact]
    public async Task H_RedisUnavailable_ShouldReturn503()
    {
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IConnectionMultiplexer));
                if (redisDescriptor != null) services.Remove(redisDescriptor);

                services.AddSingleton<IConnectionMultiplexer>(sp =>
                {
                    var conf = ConfigurationOptions.Parse("localhost:9999,abortConnect=false,connectTimeout=100");
                    return ConnectionMultiplexer.Connect(conf);
                });
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "fake-token");

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/SalesOrder");
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        request.Content = JsonContent.Create(new { });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    public class IdempotencyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
            .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
            .WithPassword("Strong_Password_123!")
            .Build();

        private readonly RedisContainer _redisContainer = new RedisBuilder()
            .WithImage("redis:7.0-alpine")
            .Build();

        public Moq.Mock<ICurrentUserService> MockCurrentUserService { get; } = new Moq.Mock<ICurrentUserService>();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureLogging(logging =>
            {
                logging.ClearProviders();
            });

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseSqlServer(_msSqlContainer.GetConnectionString());
                });

                var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IConnectionMultiplexer));
                if (redisDescriptor != null) services.Remove(redisDescriptor);

                services.AddSingleton<IConnectionMultiplexer>(sp =>
                    ConnectionMultiplexer.Connect(_redisContainer.GetConnectionString()));

                services.RemoveAll<ICurrentUserService>();
                services.AddSingleton<ICurrentUserService>(MockCurrentUserService.Object);
                
                services.AddSingleton<Microsoft.AspNetCore.Authorization.Policy.IPolicyEvaluator, FakePolicyEvaluator>();
            });
        }

        public async Task InitializeAsync()
        {
            await _msSqlContainer.StartAsync();
            await _redisContainer.StartAsync();

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();

            await db.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'RewardPoints')
                BEGIN
                    ALTER TABLE [Customers] ADD [RewardPoints] INT NOT NULL DEFAULT 0;
                END;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'TotalSpent')
                BEGIN
                    ALTER TABLE [Customers] ADD [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 0;
                END;");
        }

        public new async Task DisposeAsync()
        {
            await _msSqlContainer.DisposeAsync();
            await _redisContainer.DisposeAsync();
        }
    }
}
