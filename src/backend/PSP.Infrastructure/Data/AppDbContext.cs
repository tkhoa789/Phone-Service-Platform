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
using PSP.Domain.Modules.Idempotency.Entities;
using System.Linq.Expressions;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
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
    public DbSet<SupplierDebtTransactionEntity> SupplierDebtTransactions => Set<SupplierDebtTransactionEntity>();

    // Inventory
    public DbSet<WarehouseEntity> Warehouses => Set<WarehouseEntity>();
    public DbSet<InventoryEntity> Inventories => Set<InventoryEntity>();
    public DbSet<InventoryTransactionEntity> InventoryTransactions => Set<InventoryTransactionEntity>();
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
    public DbSet<RepairChecklistEntity> RepairChecklists => Set<RepairChecklistEntity>();
    public DbSet<RepairChecklistItemEntity> RepairChecklistItems => Set<RepairChecklistItemEntity>();
    public DbSet<RepairDepositEntity> RepairDeposits => Set<RepairDepositEntity>();

    // Notification
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<FileAttachmentEntity> FileAttachments => Set<FileAttachmentEntity>();

    // AI
    public DbSet<AIConversationEntity> AIConversations => Set<AIConversationEntity>();
    public DbSet<AIMessageEntity> AIMessages => Set<AIMessageEntity>();
    public DbSet<AIToolCallEntity> AIToolCalls => Set<AIToolCallEntity>();
    public DbSet<AIKnowledgeDocumentEntity> AIKnowledgeDocuments => Set<AIKnowledgeDocumentEntity>();

    // Idempotency
    public DbSet<IdempotencyRecordEntity> IdempotencyRecords => Set<IdempotencyRecordEntity>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

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

        // Tắt Cascade Delete toàn cục & chuẩn hóa toàn bộ khóa ngoại về Restrict
        var cascadeFKs = modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetForeignKeys())
            .Where(fk => !fk.IsOwnership && (fk.DeleteBehavior == DeleteBehavior.Cascade || fk.DeleteBehavior == DeleteBehavior.ClientSetNull));

        foreach (var fk in cascadeFKs)
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Cấu hình riêng cho môi trường Test SQLite (vì SQLite không hỗ trợ RowVersion tự động)
        if (Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var rowVersionProp = entityType.FindProperty("RowVersion");
                if (rowVersionProp != null && rowVersionProp.ClrType == typeof(byte[]))
                {
                    rowVersionProp.SetDefaultValue(new byte[8]);
                }
            }
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
        // 1. Gán thông tin người tạo/người sửa tự động
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

        // 2. Tự động ghi nhật ký hệ thống (Audit Logs)
        var auditEntries = OnBeforeSaveChanges();
        foreach (var auditEntry in auditEntries)
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private List<AuditEntry> OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        var systemAdminId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var userId = string.IsNullOrEmpty(_currentUserService.UserId) ? systemAdminId : Guid.Parse(_currentUserService.UserId);

        foreach (var entry in ChangeTracker.Entries())
        {
            // Bỏ qua bản ghi Audit Log, những dòng không thay đổi hoặc không kế thừa BaseEntity
            if (entry.Entity is AuditLogEntity || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            if (entry.Entity is not BaseEntity baseEntity)
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                TableName = entry.Entity.GetType().Name,
                UserId = userId,
                EntityId = baseEntity.Id
            };
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;
                
                // Loại trừ các trường hệ thống để log ngắn gọn, dễ đọc
                if (propertyName == "CreatedAt" || propertyName == "CreatedBy" ||
                    propertyName == "UpdatedAt" || propertyName == "UpdatedBy" ||
                    propertyName == "DeletedAt" || propertyName == "Id")
                {
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.Action = "CREATE";
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;

                    case EntityState.Deleted:
                        auditEntry.Action = "DELETE";
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;

                    case EntityState.Modified:
                        // Kiểm tra nếu là hành động xóa mềm (IsDeleted thay đổi từ false sang true)
                        if (propertyName == "IsDeleted" && (bool?)property.CurrentValue == true && (bool?)property.OriginalValue == false)
                        {
                            auditEntry.Action = "DELETE";
                        }
                        
                        if (property.IsModified)
                        {
                            if (auditEntry.Action == "UPDATE" || string.IsNullOrEmpty(auditEntry.Action))
                            {
                                auditEntry.Action = "UPDATE";
                            }
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }
        }

        return auditEntries;
    }

    private static LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = Expression.Parameter(type, "e");
        var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var body = Expression.Equal(property, Expression.Constant(false));
        return Expression.Lambda(body, parameter);
    }
}
