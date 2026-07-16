using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateItemsToInheritBaseEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItemEntity_ProductVariants_ProductVariantId",
                table: "PurchaseOrderItemEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItemEntity_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItemEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_StockTakeItemEntity_ProductVariants_ProductVariantId",
                table: "StockTakeItemEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_StockTakeItemEntity_StockTakes_StockTakeId",
                table: "StockTakeItemEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseTransferItemEntity_ProductVariants_ProductVariantId",
                table: "WarehouseTransferItemEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseTransferItemEntity_WarehouseTransfers_TransferId",
                table: "WarehouseTransferItemEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WarehouseTransferItemEntity",
                table: "WarehouseTransferItemEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StockTakeItemEntity",
                table: "StockTakeItemEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PurchaseOrderItemEntity",
                table: "PurchaseOrderItemEntity");

            migrationBuilder.RenameTable(
                name: "WarehouseTransferItemEntity",
                newName: "WarehouseTransferItems");

            migrationBuilder.RenameTable(
                name: "StockTakeItemEntity",
                newName: "StockTakeItems");

            migrationBuilder.RenameTable(
                name: "PurchaseOrderItemEntity",
                newName: "PurchaseOrderItems");

            migrationBuilder.RenameIndex(
                name: "IX_WarehouseTransferItemEntity_TransferId",
                table: "WarehouseTransferItems",
                newName: "IX_WarehouseTransferItems_TransferId");

            migrationBuilder.RenameIndex(
                name: "IX_WarehouseTransferItemEntity_ProductVariantId",
                table: "WarehouseTransferItems",
                newName: "IX_WarehouseTransferItems_ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_StockTakeItemEntity_StockTakeId",
                table: "StockTakeItems",
                newName: "IX_StockTakeItems_StockTakeId");

            migrationBuilder.RenameIndex(
                name: "IX_StockTakeItemEntity_ProductVariantId",
                table: "StockTakeItems",
                newName: "IX_StockTakeItems_ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderItemEntity_PurchaseOrderId",
                table: "PurchaseOrderItems",
                newName: "IX_PurchaseOrderItems_PurchaseOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderItemEntity_ProductVariantId",
                table: "PurchaseOrderItems",
                newName: "IX_PurchaseOrderItems_ProductVariantId");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "WarehouseTransferItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "WarehouseTransferItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "WarehouseTransferItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "WarehouseTransferItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "WarehouseTransferItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "WarehouseTransferItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StockTakeItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "StockTakeItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "StockTakeItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StockTakeItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StockTakeItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "StockTakeItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PurchaseOrderItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "PurchaseOrderItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "PurchaseOrderItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PurchaseOrderItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PurchaseOrderItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "PurchaseOrderItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_WarehouseTransferItems",
                table: "WarehouseTransferItems",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StockTakeItems",
                table: "StockTakeItems",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PurchaseOrderItems",
                table: "PurchaseOrderItems",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_ProductVariants_ProductVariantId",
                table: "PurchaseOrderItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockTakeItems_ProductVariants_ProductVariantId",
                table: "StockTakeItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockTakeItems_StockTakes_StockTakeId",
                table: "StockTakeItems",
                column: "StockTakeId",
                principalTable: "StockTakes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseTransferItems_ProductVariants_ProductVariantId",
                table: "WarehouseTransferItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseTransferItems_WarehouseTransfers_TransferId",
                table: "WarehouseTransferItems",
                column: "TransferId",
                principalTable: "WarehouseTransfers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_ProductVariants_ProductVariantId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_StockTakeItems_ProductVariants_ProductVariantId",
                table: "StockTakeItems");

            migrationBuilder.DropForeignKey(
                name: "FK_StockTakeItems_StockTakes_StockTakeId",
                table: "StockTakeItems");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseTransferItems_ProductVariants_ProductVariantId",
                table: "WarehouseTransferItems");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseTransferItems_WarehouseTransfers_TransferId",
                table: "WarehouseTransferItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WarehouseTransferItems",
                table: "WarehouseTransferItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StockTakeItems",
                table: "StockTakeItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PurchaseOrderItems",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "WarehouseTransferItems");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "StockTakeItems");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PurchaseOrderItems");

            migrationBuilder.RenameTable(
                name: "WarehouseTransferItems",
                newName: "WarehouseTransferItemEntity");

            migrationBuilder.RenameTable(
                name: "StockTakeItems",
                newName: "StockTakeItemEntity");

            migrationBuilder.RenameTable(
                name: "PurchaseOrderItems",
                newName: "PurchaseOrderItemEntity");

            migrationBuilder.RenameIndex(
                name: "IX_WarehouseTransferItems_TransferId",
                table: "WarehouseTransferItemEntity",
                newName: "IX_WarehouseTransferItemEntity_TransferId");

            migrationBuilder.RenameIndex(
                name: "IX_WarehouseTransferItems_ProductVariantId",
                table: "WarehouseTransferItemEntity",
                newName: "IX_WarehouseTransferItemEntity_ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_StockTakeItems_StockTakeId",
                table: "StockTakeItemEntity",
                newName: "IX_StockTakeItemEntity_StockTakeId");

            migrationBuilder.RenameIndex(
                name: "IX_StockTakeItems_ProductVariantId",
                table: "StockTakeItemEntity",
                newName: "IX_StockTakeItemEntity_ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderItems_PurchaseOrderId",
                table: "PurchaseOrderItemEntity",
                newName: "IX_PurchaseOrderItemEntity_PurchaseOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderItems_ProductVariantId",
                table: "PurchaseOrderItemEntity",
                newName: "IX_PurchaseOrderItemEntity_ProductVariantId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WarehouseTransferItemEntity",
                table: "WarehouseTransferItemEntity",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StockTakeItemEntity",
                table: "StockTakeItemEntity",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PurchaseOrderItemEntity",
                table: "PurchaseOrderItemEntity",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItemEntity_ProductVariants_ProductVariantId",
                table: "PurchaseOrderItemEntity",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItemEntity_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItemEntity",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockTakeItemEntity_ProductVariants_ProductVariantId",
                table: "StockTakeItemEntity",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockTakeItemEntity_StockTakes_StockTakeId",
                table: "StockTakeItemEntity",
                column: "StockTakeId",
                principalTable: "StockTakes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseTransferItemEntity_ProductVariants_ProductVariantId",
                table: "WarehouseTransferItemEntity",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseTransferItemEntity_WarehouseTransfers_TransferId",
                table: "WarehouseTransferItemEntity",
                column: "TransferId",
                principalTable: "WarehouseTransfers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
