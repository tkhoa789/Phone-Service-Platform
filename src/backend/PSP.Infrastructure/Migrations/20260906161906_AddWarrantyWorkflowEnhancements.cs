using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarrantyWorkflowEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidencePhotoUrls",
                table: "WarrantyTickets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectNotes",
                table: "WarrantyTickets",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectReason",
                table: "WarrantyTickets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RepairTicketId",
                table: "WarrantyTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingNumber",
                table: "WarrantyTickets",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TransferToPaidRepair",
                table: "WarrantyTickets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VendorName",
                table: "WarrantyTickets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorSubStatus",
                table: "WarrantyTickets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorTicketNumber",
                table: "WarrantyTickets",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ActorId",
                table: "WarrantyHistories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorName",
                table: "WarrantyHistories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "WarrantyHistories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WarrantyTicketId",
                table: "RepairTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarrantyTickets_RepairTicketId",
                table: "WarrantyTickets",
                column: "RepairTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairTickets_WarrantyTicketId",
                table: "RepairTickets",
                column: "WarrantyTicketId");

            migrationBuilder.AddForeignKey(
                name: "FK_RepairTickets_WarrantyTickets_WarrantyTicketId",
                table: "RepairTickets",
                column: "WarrantyTicketId",
                principalTable: "WarrantyTickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarrantyTickets_RepairTickets_RepairTicketId",
                table: "WarrantyTickets",
                column: "RepairTicketId",
                principalTable: "RepairTickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepairTickets_WarrantyTickets_WarrantyTicketId",
                table: "RepairTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_WarrantyTickets_RepairTickets_RepairTicketId",
                table: "WarrantyTickets");

            migrationBuilder.DropIndex(
                name: "IX_WarrantyTickets_RepairTicketId",
                table: "WarrantyTickets");

            migrationBuilder.DropIndex(
                name: "IX_RepairTickets_WarrantyTicketId",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "EvidencePhotoUrls",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "RejectNotes",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "RejectReason",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "RepairTicketId",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "TrackingNumber",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "TransferToPaidRepair",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "VendorName",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "VendorSubStatus",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "VendorTicketNumber",
                table: "WarrantyTickets");

            migrationBuilder.DropColumn(
                name: "ActorId",
                table: "WarrantyHistories");

            migrationBuilder.DropColumn(
                name: "ActorName",
                table: "WarrantyHistories");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "WarrantyHistories");

            migrationBuilder.DropColumn(
                name: "WarrantyTicketId",
                table: "RepairTickets");
        }
    }
}
