using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FE3_DomainHardening_RepairExecution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CostAtWriteOff",
                table: "RepairParts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ImeiId",
                table: "RepairParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "RepairParts",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "RepairParts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Reserved");

            // Backfill RepairParts.Status based on deterministic lifecycle
            migrationBuilder.Sql(@"
                UPDATE rp
                SET rp.Status = 
                    CASE 
                        WHEN rt.Status IN ('Received', 'Diagnosing', 'WaitingApproval', 'WaitingForParts') THEN 'Reserved'
                        WHEN rt.Status IN ('Repairing', 'WaitingQC') THEN 'Issued'
                        WHEN rt.Status IN ('Completed', 'WaitingPickup', 'Delivered') THEN 'Installed'
                        WHEN rt.Status = 'Cancelled' THEN 'Returned'
                        ELSE 'Reserved'
                    END
                FROM RepairParts rp
                JOIN RepairTickets rt ON rp.RepairTicketId = rt.Id
                WHERE rp.Status = 'Reserved'
            ");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Imeis",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            // Map old int values to new string enum values for Imeis.Status
            migrationBuilder.Sql(@"
                UPDATE Imeis SET Status = 'InStock' WHERE Status = '0';
                UPDATE Imeis SET Status = 'Sold' WHERE Status = '1';
                UPDATE Imeis SET Status = 'Repairing' WHERE Status = '2';
                UPDATE Imeis SET Status = 'WarrantyHold' WHERE Status = '3';
                UPDATE Imeis SET Status = 'Disposed' WHERE Status = '4';
            ");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Imeis",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateTable(
                name: "InventoryTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductVariantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImeiId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuantityChange = table.Column<int>(type: "int", nullable: false),
                    CostSnapshot = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Imeis_ImeiId",
                        column: x => x.ImeiId,
                        principalTable: "Imeis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_ProductVariants_ProductVariantId",
                        column: x => x.ProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RepairParts_ImeiId",
                table: "RepairParts",
                column: "ImeiId",
                unique: true,
                filter: "[ImeiId] IS NOT NULL AND [Status] IN ('Reserved', 'Issued', 'Installed')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Inventory_Quantity",
                table: "Inventories",
                sql: "[Quantity] >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_ImeiId",
                table: "InventoryTransactions",
                column: "ImeiId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_ProductVariantId",
                table: "InventoryTransactions",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_WarehouseId",
                table: "InventoryTransactions",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_RepairParts_Imeis_ImeiId",
                table: "RepairParts",
                column: "ImeiId",
                principalTable: "Imeis",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepairParts_Imeis_ImeiId",
                table: "RepairParts");

            migrationBuilder.DropTable(
                name: "InventoryTransactions");

            migrationBuilder.DropIndex(
                name: "IX_RepairParts_ImeiId",
                table: "RepairParts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Inventory_Quantity",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "CostAtWriteOff",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "ImeiId",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Imeis");

            // SAFE DOWN MIGRATION: Convert enum string back to numeric representation
            // Must happen BEFORE AlterColumn<int> to prevent crash!
            migrationBuilder.Sql(@"
                UPDATE Imeis SET Status = '0' WHERE Status = 'InStock';
                UPDATE Imeis SET Status = '1' WHERE Status = 'Sold';
                UPDATE Imeis SET Status = '2' WHERE Status = 'Repairing';
                UPDATE Imeis SET Status = '3' WHERE Status = 'WarrantyHold';
                UPDATE Imeis SET Status = '4' WHERE Status = 'Disposed';
                UPDATE Imeis SET Status = '5' WHERE Status = 'WrittenOff';
            ");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Imeis",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
