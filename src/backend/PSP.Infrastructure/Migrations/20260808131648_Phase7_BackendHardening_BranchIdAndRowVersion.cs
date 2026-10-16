using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase7_BackendHardening_BranchIdAndRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BranchId",
                table: "RepairTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "RepairTickets",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<Guid>(
                name: "BranchId",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RepairTickets_BranchId",
                table: "RepairTickets",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_BranchId",
                table: "Invoices",
                column: "BranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Branches_BranchId",
                table: "Invoices",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RepairTickets_Branches_BranchId",
                table: "RepairTickets",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // ---------------------------------------------------------------------------------------------------------
            // CRITICAL NOTE: DATA BACKFILL SKIPPED
            // ---------------------------------------------------------------------------------------------------------
            // MIGRATION POLICY (PHASE 7): "Nếu database hiện tại không có historical branch information đủ tin cậy 
            // để xác định BranchId chính xác: DỪNG migration data transformation."
            // 
            // Reason: The old system only recorded `ReceivedById`. There is no `EmployeeTransferLog` or similar historical 
            // table that proves which branch an employee was in AT THE TIME they created the RepairTicket. 
            // If an employee was transferred, assigning their *current* branch to their *past* tickets would corrupt 
            // historical accounting and BOLA.
            // 
            // Action: `BranchId` is left as nullable (`Guid?`) for existing records. The application logic has been 
            // updated to handle `BranchId == null` as legacy records that cannot be confidently isolated or exported 
            // to a specific branch's inventory/financials.
            // ---------------------------------------------------------------------------------------------------------
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Branches_BranchId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_RepairTickets_Branches_BranchId",
                table: "RepairTickets");

            migrationBuilder.DropIndex(
                name: "IX_RepairTickets_BranchId",
                table: "RepairTickets");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_BranchId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Invoices");
        }
    }
}
