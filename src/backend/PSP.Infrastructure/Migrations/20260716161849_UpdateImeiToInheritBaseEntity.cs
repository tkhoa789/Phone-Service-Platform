using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateImeiToInheritBaseEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Imeis_Warehouses_WarehouseId",
                table: "Imeis");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Imeis",
                table: "Imeis");

            migrationBuilder.AlterColumn<string>(
                name: "Imei",
                table: "Imeis",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "Imeis",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Imeis",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Imeis",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Imeis",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Imeis",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Imeis",
                table: "Imeis",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Imeis_Imei",
                table: "Imeis",
                column: "Imei",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Imeis_Warehouses_WarehouseId",
                table: "Imeis",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Imeis_Warehouses_WarehouseId",
                table: "Imeis");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Imeis",
                table: "Imeis");

            migrationBuilder.DropIndex(
                name: "IX_Imeis_Imei",
                table: "Imeis");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Imeis");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Imeis");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Imeis");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Imeis");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Imeis");

            migrationBuilder.AlterColumn<string>(
                name: "Imei",
                table: "Imeis",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Imeis",
                table: "Imeis",
                column: "Imei");

            migrationBuilder.AddForeignKey(
                name: "FK_Imeis_Warehouses_WarehouseId",
                table: "Imeis",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id");
        }
    }
}
