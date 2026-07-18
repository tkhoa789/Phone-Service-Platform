using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRepairEntitiesToInheritBaseEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "RepairStatusHistories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "RepairStatusHistories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RepairStatusHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "RepairStatusHistories",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "RepairStatusHistories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RepairParts",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "RepairParts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "RepairParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RepairParts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "RepairParts",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "RepairParts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "RepairParts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "RepairParts");
        }
    }
}
