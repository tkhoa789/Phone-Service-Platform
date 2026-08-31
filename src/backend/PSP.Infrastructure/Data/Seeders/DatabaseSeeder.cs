using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Sales.Entities;

namespace PSP.Infrastructure.Data.Seeders;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        // 1. Auto-ensure DB columns exist in physical Customers and Suppliers tables first
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'RewardPoints')
                BEGIN
                    ALTER TABLE [Customers] ADD [RewardPoints] INT NOT NULL DEFAULT 0;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = N'TotalSpent')
                BEGIN
                    ALTER TABLE [Customers] ADD [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 0;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Suppliers') AND name = N'TaxCode')
                BEGIN
                    ALTER TABLE [Suppliers] ADD [TaxCode] NVARCHAR(50) NULL;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Suppliers') AND name = N'DebtAmount')
                BEGIN
                    ALTER TABLE [Suppliers] ADD [DebtAmount] DECIMAL(18,2) NOT NULL DEFAULT 0;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Suppliers') AND name = N'CreditLimit')
                BEGIN
                    ALTER TABLE [Suppliers] ADD [CreditLimit] DECIMAL(18,2) NOT NULL DEFAULT 500000000;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Suppliers') AND name = N'PaymentTermsDays')
                BEGIN
                    ALTER TABLE [Suppliers] ADD [PaymentTermsDays] INT NOT NULL DEFAULT 30;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'SupplierDebtTransactions')
                BEGIN
                    CREATE TABLE [SupplierDebtTransactions] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [SupplierId] UNIQUEIDENTIFIER NOT NULL,
                        [TransactionType] NVARCHAR(30) NOT NULL,
                        [Amount] DECIMAL(18,2) NOT NULL,
                        [BalanceAfter] DECIMAL(18,2) NOT NULL,
                        [ReferenceNo] NVARCHAR(50) NULL,
                        [PaymentMethod] NVARCHAR(30) NULL,
                        [Note] NVARCHAR(500) NULL,
                        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [CreatedBy] NVARCHAR(100) NULL,
                        [UpdatedAt] DATETIME2 NULL,
                        [UpdatedBy] NVARCHAR(100) NULL,
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [DeletedAt] DATETIME2 NULL,
                        [DeletedBy] NVARCHAR(100) NULL,
                        CONSTRAINT [FK_SupplierDebtTransactions_Suppliers] FOREIGN KEY ([SupplierId]) REFERENCES [Suppliers]([Id]) ON DELETE CASCADE
                    );
                END;
            ");
        }
        catch (Exception exRaw)
        {
            logger.LogWarning(exRaw, "⚠️ Could not run raw ALTER TABLE script on Customers/Suppliers table.");
        }

        try
        {
            // Removed: await context.Database.MigrateAsync(); (INFRA-OPS-002)
            // Database migration should be handled explicitly via CI/CD deployment scripts, not at runtime.

            await SeedBranchAsync(context, logger);
            await SeedRolesAsync(context, logger);
            await SeedPermissionsAsync(context, logger);
            await SeedUsersAsync(context, passwordHasher, logger);
            await SeedUserRolesAsync(context, logger);
            await SeedRolePermissionsAsync(context, logger);
            await SeedPaymentMethodsAsync(context, logger);

            logger.LogInformation("✅ Database Seeder hoàn thành. Dữ liệu gốc đã sẵn sàng.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Lỗi khi gieo dữ liệu ban đầu.");
        }
    }

    private static async Task SeedPaymentMethodsAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Set<PaymentMethodEntity>().AnyAsync())
        {
            return;
        }

        var methods = new List<PaymentMethodEntity>
        {
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), Code = "CASH", Name = "Tiền mặt", IsActive = true, CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000002"), Code = "BANK_TRANSFER", Name = "Chuyển khoản (VietQR)", IsActive = true, CreatedBy = "SYSTEM" }
        };

        await context.Set<PaymentMethodEntity>().AddRangeAsync(methods);
        await context.SaveChangesAsync();
    }

    private static async Task SeedBranchAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Branches.AnyAsync()) return;

        var branch = new BranchEntity
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Code = "HQ",
            Name = "Trụ sở chính",
            Address = "123 Nguyễn Huệ, Quận 1, TP.HCM",
            Phone = "0901234567",
            Email = "hq@psp.com",
            Status = BranchStatus.Active,
            CreatedBy = "SYSTEM"
        };

        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolesAsync(AppDbContext context, ILogger logger)
    {
        var roles = new List<RoleEntity>
        {
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000000"), Name = "Owner",      Description = "Chủ sở hữu chuỗi - Chủ tịch điều hành duy nhất", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Admin",      Description = "Quản trị viên hệ thống IT - Toàn quyền", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "Manager",    Description = "Quản lý chi nhánh", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "Sales",      Description = "Nhân viên bán hàng POS", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "Inventory",  Description = "Nhân viên kho vận", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Technician", Description = "Kỹ thuật viên sửa chữa", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Name = "Warranty",   Description = "Nhân viên bảo hành & đổi trả", CreatedBy = "SYSTEM" }
        };

        foreach (var r in roles)
        {
            if (!await context.Roles.AnyAsync(x => x.Id == r.Id || x.Name == r.Name))
            {
                await context.Roles.AddAsync(r);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedPermissionsAsync(AppDbContext context, ILogger logger)
    {
        var permissions = new List<PermissionEntity>
        {
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000001"), Code = "BRANCH_VIEW", Name = "Xem chi nhánh", Module = "BRANCH", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000002"), Code = "USER_VIEW", Name = "Xem người dùng", Module = "USER", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000003"), Code = "AUDIT_VIEW", Name = "Xem nhật ký audit", Module = "AUDIT", CreatedBy = "SYSTEM" },
        };

        foreach (var p in permissions)
        {
            if (!await context.Permissions.AnyAsync(x => x.Id == p.Id || x.Code == p.Code))
            {
                await context.Permissions.AddAsync(p);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(AppDbContext context, IPasswordHasher passwordHasher, ILogger logger)
    {
        var mainBranchId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        var userList = new List<(Guid Id, string Username, string Pass, string Name, string Email, string Phone)>
        {
            (Guid.Parse("20000000-0000-0000-0000-000000000000"), "owner",      "Owner@123",      "Chủ sở hữu chuỗi (Owner Master)", "owner@psp.com",      "0900000000"),
            (Guid.Parse("20000000-0000-0000-0000-000000000001"), "admin",      "Admin@123",      "Quản trị viên IT (Admin System)", "admin@psp.com",      "0900000001"),
            (Guid.Parse("20000000-0000-0000-0000-000000000002"), "manager",    "Manager@123",    "Cửa hàng trưởng (Branch Manager)","manager@psp.com",    "0900000002"),
            (Guid.Parse("20000000-0000-0000-0000-000000000003"), "sales",      "Sales@123",      "Nhân viên Bán hàng POS (Cashier)","sales@psp.com",      "0900000003"),
            (Guid.Parse("20000000-0000-0000-0000-000000000004"), "inventory",  "Inventory@123",  "Thủ kho (Warehouse Controller)",  "inventory@psp.com",  "0900000004"),
            (Guid.Parse("20000000-0000-0000-0000-000000000005"), "technician", "Technician@123", "Kỹ thuật viên (Repair Tech)",     "technician@psp.com", "0900000005"),
            (Guid.Parse("20000000-0000-0000-0000-000000000006"), "warranty",   "Warranty@123",   "Nhân viên Bảo hành (Warranty)",   "warranty@psp.com",   "0900000006"),
        };

        foreach (var u in userList)
        {
            if (!await context.Users.AnyAsync(user => user.Username == u.Username))
            {
                var newUser = new UserEntity
                {
                    Id = u.Id,
                    BranchId = mainBranchId,
                    Username = u.Username,
                    PasswordHash = passwordHasher.Hash(u.Pass),
                    FullName = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Status = UserStatus.Active,
                    CreatedBy = "SYSTEM"
                };
                await context.Users.AddAsync(newUser);
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedUserRolesAsync(AppDbContext context, ILogger logger)
    {
        var roleMappings = new List<(Guid UserId, string RoleName)>
        {
            (Guid.Parse("20000000-0000-0000-0000-000000000000"), "Owner"),
            (Guid.Parse("20000000-0000-0000-0000-000000000001"), "Admin"),
            (Guid.Parse("20000000-0000-0000-0000-000000000002"), "Manager"),
            (Guid.Parse("20000000-0000-0000-0000-000000000003"), "Sales"),
            (Guid.Parse("20000000-0000-0000-0000-000000000004"), "Inventory"),
            (Guid.Parse("20000000-0000-0000-0000-000000000005"), "Technician"),
            (Guid.Parse("20000000-0000-0000-0000-000000000006"), "Warranty"),
        };

        foreach (var map in roleMappings)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == map.RoleName);
            if (role != null && await context.Users.AnyAsync(u => u.Id == map.UserId))
            {
                if (!await context.UserRoles.AnyAsync(ur => ur.UserId == map.UserId && ur.RoleId == role.Id))
                {
                    await context.UserRoles.AddAsync(new UserRoleEntity { UserId = map.UserId, RoleId = role.Id });
                }
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedRolePermissionsAsync(AppDbContext context, ILogger logger)
    {
        var allPermissions = await context.Permissions.ToListAsync();
        var rolesToGrantAll = new[] { "Owner", "Admin" };

        foreach (var roleName in rolesToGrantAll)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role != null && !await context.RolePermissions.AnyAsync(rp => rp.RoleId == role.Id))
            {
                await context.RolePermissions.AddRangeAsync(allPermissions.Select(p => new RolePermissionEntity { RoleId = role.Id, PermissionId = p.Id }));
            }
        }

        await context.SaveChangesAsync();
    }
}
