using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Constants;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Inventory.Entities;
using PSP.Domain.Modules.Product.Entities;
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

        try
        {
            await SeedBranchAsync(context, logger);
            await SeedRolesAsync(context, logger);
            await SeedPermissionsAsync(context, logger);
            await SeedUsersAsync(context, passwordHasher, logger);
            await SeedUserRolesAsync(context, logger);
            await SeedRolePermissionsAsync(context, logger);
            await SeedPaymentMethodsAsync(context, logger);
            await SeedWarehouseInventoryAsync(context, logger);

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
        for (int i = 0; i < Permissions.All.Count; i++)
        {
            var code = Permissions.All[i];
            var deterministicId = Guid.Parse($"40000000-0000-0000-0000-{(i + 1):D12}");
            var parts = code.Split('.');
            var module = parts.Length > 0 ? parts[0] : "SYSTEM";

            var existing = await context.Permissions.FirstOrDefaultAsync(x => x.Code == code);
            if (existing == null)
            {
                var idTaken = await context.Permissions.AnyAsync(x => x.Id == deterministicId);
                var permId = idTaken ? Guid.NewGuid() : deterministicId;

                await context.Permissions.AddAsync(new PermissionEntity
                {
                    Id = permId,
                    Code = code,
                    Name = code,
                    Module = module,
                    CreatedBy = "SYSTEM"
                });
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
        var allPermissions = await context.Permissions.Where(p => !p.IsDeleted).ToListAsync();
        var permByCode = allPermissions.ToDictionary(p => p.Code, p => p.Id, StringComparer.OrdinalIgnoreCase);

        foreach (var roleName in CanonicalRoles.All)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role == null) continue;

            var allowedCodes = Permissions.GetPermissionsForRole(roleName);
            var existingPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var toAdd = new List<RolePermissionEntity>();
            foreach (var code in allowedCodes)
            {
                if (permByCode.TryGetValue(code, out var permId) && !existingPermIds.Contains(permId))
                {
                    toAdd.Add(new RolePermissionEntity
                    {
                        RoleId = role.Id,
                        PermissionId = permId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            if (toAdd.Count > 0)
            {
                await context.RolePermissions.AddRangeAsync(toAdd);
                logger.LogInformation("Seeded {Count} permissions for role {RoleName}", toAdd.Count, roleName);
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedWarehouseInventoryAsync(AppDbContext context, ILogger logger)
    {
        var warehouses = await context.Warehouses.Where(w => !w.IsDeleted).ToListAsync();
        var variants = await context.ProductVariants.Where(v => !v.IsDeleted).ToListAsync();
        if (!warehouses.Any() || !variants.Any()) return;

        var products = await context.Products.Where(p => !p.IsDeleted).ToListAsync();
        var categories = await context.Categories.Where(c => !c.IsDeleted).ToListAsync();

        var productCategoryMap = products.ToDictionary(p => p.Id, p => p.CategoryId);
        var categoryMap = categories.ToDictionary(c => c.Id, c => c);
        var existingImeiSet = await context.Imeis.Select(x => x.Imei).ToHashSetAsync();

        foreach (var wh in warehouses)
        {
            var existingVariantIds = await context.Inventories
                .Where(i => i.WarehouseId == wh.Id && !i.IsDeleted)
                .Select(i => i.ProductVariantId)
                .ToListAsync();

            var missingVariants = variants.Where(v => !existingVariantIds.Contains(v.Id)).ToList();
            if (missingVariants.Count > 0)
            {
                var newInventories = missingVariants.Select(v => new InventoryEntity
                {
                    Id = Guid.NewGuid(),
                    WarehouseId = wh.Id,
                    ProductVariantId = v.Id,
                    Quantity = 50,
                    MinimumStock = 5,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                await context.Inventories.AddRangeAsync(newInventories);
                logger.LogInformation("Seeded {Count} inventory rows for warehouse {WarehouseName} ({WarehouseId})", newInventories.Count, wh.Name, wh.Id);
            }

            // Also seed sample in-stock IMEIs for mobile phone variants if warehouse lacks IMEIs
            var existingImeisCount = await context.Imeis
                .Where(im => im.WarehouseId == wh.Id && !im.IsDeleted)
                .CountAsync();

            if (existingImeisCount == 0)
            {
                var newImeis = new List<ImeiEntity>();
                var whSuffix = wh.Id.ToString("N")[..6].ToUpper();

                foreach (var v in variants)
                {
                    if (productCategoryMap.TryGetValue(v.ProductId, out var catId) && categoryMap.TryGetValue(catId, out var cat))
                    {
                        var isMobile = cat.Code.StartsWith("MOBILE", StringComparison.OrdinalIgnoreCase) ||
                                       cat.Name.Contains("Điện thoại", StringComparison.OrdinalIgnoreCase);
                        if (isMobile)
                        {
                            var cleanSku = string.Concat((v.Sku ?? "SKU").Where(char.IsLetterOrDigit));
                            if (cleanSku.Length > 10) cleanSku = cleanSku[..10];

                            for (int i = 1; i <= 5; i++)
                            {
                                var candidateImei = $"{cleanSku}-{whSuffix}-{i:D3}";
                                if (existingImeiSet.Contains(candidateImei))
                                {
                                    candidateImei = $"{cleanSku}-{whSuffix}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
                                }
                                existingImeiSet.Add(candidateImei);

                                newImeis.Add(new ImeiEntity
                                {
                                    Id = Guid.NewGuid(),
                                    Imei = candidateImei,
                                    ProductVariantId = v.Id,
                                    WarehouseId = wh.Id,
                                    Status = ImeiStatus.InStock,
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                    }
                }

                if (newImeis.Count > 0)
                {
                    await context.Imeis.AddRangeAsync(newImeis);
                    logger.LogInformation("Seeded {Count} sample IMEIs for warehouse {WarehouseName}", newImeis.Count, wh.Name);
                }
            }

            // Persist per warehouse to isolate batches
            await context.SaveChangesAsync();
        }
    }
}
