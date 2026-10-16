using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateNotificationBaseEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Notifications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Notifications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Notifications",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "FileAttachments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "FileAttachments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "FileAttachments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "FileAttachments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "FileAttachments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "FileAttachments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "FileAttachments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "FileAttachments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "FileAttachments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "FileAttachments");
        }
    }
}
