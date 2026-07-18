using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;
using PSP.Domain.Modules.Sales.Entities;
using PSP.Infrastructure.Data;

namespace PSP.Infrastructure.Data.Seeders;

/// <summary>
/// =====================================================================
/// BỘ GIEO DỮ LIỆU BAN ĐẦU (DatabaseSeeder)
/// =====================================================================
/// 
/// File này chạy MỘT LẦN DUY NHẤT khi ứng dụng khởi động lần đầu.
/// Nhiệm vụ: Tạo sẵn dữ liệu gốc (Seed Data) vào Database để hệ thống
/// có thể hoạt động ngay lập tức mà không cần nhập liệu thủ công.
///
/// DỮ LIỆU ĐƯỢC GIEO:
/// 1. Chi nhánh mặc định (Trụ sở chính).
/// 2. Tài khoản Admin mặc định (username: admin, password: Admin@123).
/// 3. Các vai trò (Roles): Admin, Manager, Sales, Inventory, Technician.
/// 4. Các quyền hạn (Permissions): USER_CREATE, SALES_VIEW, v.v.
/// 5. Gán vai trò Admin cho tài khoản Admin.
/// 6. Gán toàn bộ quyền cho vai trò Admin.
///
/// QUAN TRỌNG: Dữ liệu chỉ được tạo nếu CHƯA TỒN TẠI.
/// Chạy đi chạy lại bao nhiêu lần cũng không bị trùng lặp (Idempotent).
/// =====================================================================
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>
    /// Hàm chính: Được gọi từ Program.cs khi ứng dụng khởi động.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        // Tạo một "phạm vi" DI tạm thời để lấy các dịch vụ cần thiết.
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            // Tự động chạy Migration (tạo bảng nếu chưa có).
            await context.Database.MigrateAsync();

            // Gieo dữ liệu theo thứ tự phụ thuộc:
            //   Branch → Role → Permission → User → UserRole → RolePermission
            await SeedBranchAsync(context, logger);
            await SeedRolesAsync(context, logger);
            await SeedPermissionsAsync(context, logger);
            await SeedAdminUserAsync(context, passwordHasher, logger);
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

    // =====================================================================
    // 7. GIEO PHƯƠNG THỨC THANH TOÁN MẶC ĐỊNH
    // =====================================================================
    private static async Task SeedPaymentMethodsAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Set<PaymentMethodEntity>().AnyAsync())
        {
            logger.LogInformation("  → Phương thức thanh toán đã tồn tại. Bỏ qua.");
            return;
        }

        var methods = new List<PaymentMethodEntity>
        {
            new()
            {
                Id = Guid.Parse("30000000-0000-0000-0000-000000000001"),
                Code = "CASH",
                Name = "Tiền mặt",
                IsActive = true,
                CreatedBy = "SYSTEM"
            },
            new()
            {
                Id = Guid.Parse("30000000-0000-0000-0000-000000000002"),
                Code = "BANK_TRANSFER",
                Name = "Chuyển khoản ngân hàng",
                IsActive = true,
                CreatedBy = "SYSTEM"
            }
        };

        await context.Set<PaymentMethodEntity>().AddRangeAsync(methods);
        await context.SaveChangesAsync();
    }

    // =====================================================================
    // 1. GIEO CHI NHÁNH MẶC ĐỊNH
    // =====================================================================
    private static async Task SeedBranchAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Branches.AnyAsync())
        {
            logger.LogInformation("  → Chi nhánh đã tồn tại. Bỏ qua.");
            return;
        }

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
        logger.LogInformation("  → Đã tạo Chi nhánh mặc định: {Name}", branch.Name);
    }

    // =====================================================================
    // 2. GIEO CÁC VAI TRÒ (ROLES)
    // =====================================================================
    private static async Task SeedRolesAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Roles.AnyAsync())
        {
            logger.LogInformation("  → Roles đã tồn tại. Bỏ qua.");
            return;
        }

        var roles = new List<RoleEntity>
        {
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Admin",      Description = "Quản trị viên hệ thống - Toàn quyền", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "Manager",    Description = "Quản lý chi nhánh", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "Sales",      Description = "Nhân viên bán hàng", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "Inventory",  Description = "Nhân viên kho vận", CreatedBy = "SYSTEM" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Technician", Description = "Kỹ thuật viên sửa chữa", CreatedBy = "SYSTEM" }
        };

        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();
        logger.LogInformation("  → Đã tạo {Count} Roles.", roles.Count);
    }

    // =====================================================================
    // 3. GIEO CÁC QUYỀN HẠN (PERMISSIONS)
    // =====================================================================
    private static async Task SeedPermissionsAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Permissions.AnyAsync())
        {
            logger.LogInformation("  → Permissions đã tồn tại. Bỏ qua.");
            return;
        }

        var permissions = new List<PermissionEntity>
        {
            // Quyền quản lý User
            new() { Code = "USER_VIEW",   Name = "Xem người dùng",   Module = "Auth", CreatedBy = "SYSTEM" },
            new() { Code = "USER_CREATE", Name = "Tạo người dùng",   Module = "Auth", CreatedBy = "SYSTEM" },
            new() { Code = "USER_UPDATE", Name = "Sửa người dùng",   Module = "Auth", CreatedBy = "SYSTEM" },
            new() { Code = "USER_DELETE", Name = "Xóa người dùng",   Module = "Auth", CreatedBy = "SYSTEM" },

            // Quyền quản lý Chi nhánh
            new() { Code = "BRANCH_VIEW",   Name = "Xem chi nhánh",   Module = "Branch", CreatedBy = "SYSTEM" },
            new() { Code = "BRANCH_CREATE", Name = "Tạo chi nhánh",   Module = "Branch", CreatedBy = "SYSTEM" },
            new() { Code = "BRANCH_UPDATE", Name = "Sửa chi nhánh",   Module = "Branch", CreatedBy = "SYSTEM" },
            new() { Code = "BRANCH_DELETE", Name = "Xóa chi nhánh",   Module = "Branch", CreatedBy = "SYSTEM" },

            // Quyền quản lý Sản phẩm
            new() { Code = "PRODUCT_VIEW",   Name = "Xem sản phẩm",   Module = "Product", CreatedBy = "SYSTEM" },
            new() { Code = "PRODUCT_CREATE", Name = "Tạo sản phẩm",   Module = "Product", CreatedBy = "SYSTEM" },
            new() { Code = "PRODUCT_UPDATE", Name = "Sửa sản phẩm",   Module = "Product", CreatedBy = "SYSTEM" },
            new() { Code = "PRODUCT_DELETE", Name = "Xóa sản phẩm",   Module = "Product", CreatedBy = "SYSTEM" },

            // Quyền quản lý Kho
            new() { Code = "INVENTORY_VIEW",   Name = "Xem tồn kho",   Module = "Inventory", CreatedBy = "SYSTEM" },
            new() { Code = "INVENTORY_MANAGE", Name = "Quản lý tồn kho", Module = "Inventory", CreatedBy = "SYSTEM" },

            // Quyền quản lý Bán hàng
            new() { Code = "SALES_VIEW",   Name = "Xem đơn hàng",   Module = "Sales", CreatedBy = "SYSTEM" },
            new() { Code = "SALES_CREATE", Name = "Tạo đơn hàng",   Module = "Sales", CreatedBy = "SYSTEM" },

            // Quyền quản lý Sửa chữa
            new() { Code = "REPAIR_VIEW",   Name = "Xem phiếu sửa chữa",   Module = "Repair", CreatedBy = "SYSTEM" },
            new() { Code = "REPAIR_MANAGE", Name = "Quản lý phiếu sửa chữa", Module = "Repair", CreatedBy = "SYSTEM" },
        };

        await context.Permissions.AddRangeAsync(permissions);
        await context.SaveChangesAsync();
        logger.LogInformation("  → Đã tạo {Count} Permissions.", permissions.Count);
    }

    // =====================================================================
    // 4. GIEO TÀI KHOẢN ADMIN MẶC ĐỊNH
    // =====================================================================
    private static async Task SeedAdminUserAsync(AppDbContext context, IPasswordHasher passwordHasher, ILogger logger)
    {
        if (await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            logger.LogInformation("  → Tài khoản Admin đã tồn tại. Bỏ qua.");
            return;
        }

        var admin = new UserEntity
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            BranchId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Username = "admin",
            PasswordHash = passwordHasher.Hash("Admin@123"),  // Mật khẩu mặc định → ĐỔI NGAY khi lên Production!
            FullName = "Quản trị viên hệ thống",
            Email = "admin@psp.com",
            Phone = "0900000001",
            Status = UserStatus.Active,
            CreatedBy = "SYSTEM"
        };

        await context.Users.AddAsync(admin);
        await context.SaveChangesAsync();
        logger.LogInformation("  → Đã tạo tài khoản Admin mặc định (username: admin, password: Admin@123).");
    }

    // =====================================================================
    // 5. GÁN VAI TRÒ ADMIN CHO TÀI KHOẢN ADMIN
    // =====================================================================
    private static async Task SeedUserRolesAsync(AppDbContext context, ILogger logger)
    {
        var adminUserId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var adminRoleId = Guid.Parse("10000000-0000-0000-0000-000000000001");

        if (await context.UserRoles.AnyAsync(ur => ur.UserId == adminUserId && ur.RoleId == adminRoleId))
        {
            logger.LogInformation("  → UserRole cho Admin đã tồn tại. Bỏ qua.");
            return;
        }

        var userRole = new UserRoleEntity
        {
            UserId = adminUserId,
            RoleId = adminRoleId
        };

        await context.UserRoles.AddAsync(userRole);
        await context.SaveChangesAsync();
        logger.LogInformation("  → Đã gán vai trò Admin cho tài khoản admin.");
    }

    // =====================================================================
    // 6. GÁN TOÀN BỘ QUYỀN CHO VAI TRÒ ADMIN
    // =====================================================================
    private static async Task SeedRolePermissionsAsync(AppDbContext context, ILogger logger)
    {
        var adminRoleId = Guid.Parse("10000000-0000-0000-0000-000000000001");

        if (await context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRoleId))
        {
            logger.LogInformation("  → RolePermissions cho Admin đã tồn tại. Bỏ qua.");
            return;
        }

        // Lấy toàn bộ Permission trong hệ thống
        var allPermissions = await context.Permissions.ToListAsync();

        // Gán tất cả cho vai trò Admin (Admin có toàn quyền)
        var rolePermissions = allPermissions.Select(p => new RolePermissionEntity
        {
            RoleId = adminRoleId,
            PermissionId = p.Id
        }).ToList();

        await context.RolePermissions.AddRangeAsync(rolePermissions);
        await context.SaveChangesAsync();
        logger.LogInformation("  → Đã gán {Count} quyền cho vai trò Admin.", rolePermissions.Count);
    }
}
