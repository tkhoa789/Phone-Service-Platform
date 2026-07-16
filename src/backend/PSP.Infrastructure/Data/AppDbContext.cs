using Microsoft.EntityFrameworkCore;
using PSP.Domain.Common.Entities;
using PSP.Domain.Modules.AI.Entities;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Customer.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Notification.Entities;
using PSP.Domain.Modules.Product.Entities;
using PSP.Domain.Modules.Repair.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Domain.Modules.Warranty.Entities;
using System.Linq.Expressions;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService currentUserService) : base(options) 
    { 
        _currentUserService = currentUserService;
    }

    // Branch
    public DbSet<BranchEntity> Branches => Set<BranchEntity>();

    // Auth
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<PermissionEntity> Permissions => Set<PermissionEntity>();
    public DbSet<UserRoleEntity> UserRoles => Set<UserRoleEntity>();
    public DbSet<RolePermissionEntity> RolePermissions => Set<RolePermissionEntity>();
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();
    public DbSet<LoginHistoryEntity> LoginHistories => Set<LoginHistoryEntity>();
    public DbSet<AuditLogEntity> AuditLogs => Set<AuditLogEntity>();

    // Product
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<BrandEntity> Brands => Set<BrandEntity>();
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<ProductVariantEntity> ProductVariants => Set<ProductVariantEntity>();
    public DbSet<SupplierEntity> Suppliers => Set<SupplierEntity>();

    // Inventory
    public DbSet<WarehouseEntity> Warehouses => Set<WarehouseEntity>();
    public DbSet<InventoryEntity> Inventories => Set<InventoryEntity>();
    public DbSet<ImeiEntity> Imeis => Set<ImeiEntity>();
    public DbSet<PurchaseOrderEntity> PurchaseOrders => Set<PurchaseOrderEntity>();
    public DbSet<PurchaseOrderItemEntity> PurchaseOrderItems => Set<PurchaseOrderItemEntity>();
    public DbSet<WarehouseTransferEntity> WarehouseTransfers => Set<WarehouseTransferEntity>();
    public DbSet<WarehouseTransferItemEntity> WarehouseTransferItems => Set<WarehouseTransferItemEntity>();
    public DbSet<StockTakeEntity> StockTakes => Set<StockTakeEntity>();
    public DbSet<StockTakeItemEntity> StockTakeItems => Set<StockTakeItemEntity>();

    // Customer
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();

    // Sales
    public DbSet<PromotionEntity> Promotions => Set<PromotionEntity>();
    public DbSet<VoucherEntity> Vouchers => Set<VoucherEntity>();
    public DbSet<SalesOrderEntity> SalesOrders => Set<SalesOrderEntity>();
    public DbSet<SalesOrderItemEntity> SalesOrderItems => Set<SalesOrderItemEntity>();
    public DbSet<InvoiceEntity> Invoices => Set<InvoiceEntity>();
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();

    // Warranty
    public DbSet<WarrantyTicketEntity> WarrantyTickets => Set<WarrantyTicketEntity>();
    public DbSet<WarrantyHistoryEntity> WarrantyHistories => Set<WarrantyHistoryEntity>();

    // Repair
    public DbSet<RepairTicketEntity> RepairTickets => Set<RepairTicketEntity>();
    public DbSet<RepairPartEntity> RepairParts => Set<RepairPartEntity>();
    public DbSet<RepairStatusHistoryEntity> RepairStatusHistories => Set<RepairStatusHistoryEntity>();

    // Notification
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<FileAttachmentEntity> FileAttachments => Set<FileAttachmentEntity>();

    // AI
    public DbSet<AIConversationEntity> AIConversations => Set<AIConversationEntity>();
    public DbSet<AIMessageEntity> AIMessages => Set<AIMessageEntity>();
    public DbSet<AIToolCallEntity> AIToolCalls => Set<AIToolCallEntity>();
    public DbSet<AIKnowledgeDocumentEntity> AIKnowledgeDocuments => Set<AIKnowledgeDocumentEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Áp dụng Fluent API Configurations từ assemblies
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Cấu hình Precision và Scale mặc định cho mọi kiểu decimal (tránh lỗi truncation)
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Tắt Cascade Delete toàn cục
        var cascadeFKs = modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetForeignKeys())
            .Where(fk => !fk.IsOwnership && fk.DeleteBehavior == DeleteBehavior.Cascade);

        foreach (var fk in cascadeFKs)
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Cấu hình Global Query Filter cho Soft Delete (IsDeleted == false)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = _currentUserService.UserId ?? "SYSTEM";
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.IsDeleted = false;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedBy = _currentUserService.UserId ?? "SYSTEM";
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private static LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = Expression.Parameter(type, "e");
        var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var body = Expression.Equal(property, Expression.Constant(false));
        return Expression.Lambda(body, parameter);
    }
}
