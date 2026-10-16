using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase8_RepairModuleEnterpriseHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomerApprovalMethod",
                table: "RepairTickets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerApprovalNote",
                table: "RepairTickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerApprovalStatus",
                table: "RepairTickets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CustomerApprovedAmount",
                table: "RepairTickets",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomerApprovedAt",
                table: "RepairTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerApprovedById",
                table: "RepairTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "RepairTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveredById",
                table: "RepairTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveredToCustomerName",
                table: "RepairTickets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryNotes",
                table: "RepairTickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliverySignatureUrl",
                table: "RepairTickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DiagnosedAt",
                table: "RepairTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DiagnosedById",
                table: "RepairTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiagnosisProposedSolution",
                table: "RepairTickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiagnosisRootCause",
                table: "RepairTickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDays",
                table: "RepairTickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicalNotes",
                table: "RepairTickets",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "RepairStatusHistories",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Action",
                table: "RepairStatusHistories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ActorId",
                table: "RepairStatusHistories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorName",
                table: "RepairStatusHistories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "RepairStatusHistories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerApprovalMethod",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "CustomerApprovalNote",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "CustomerApprovalStatus",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "CustomerApprovedAmount",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "CustomerApprovedAt",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "CustomerApprovedById",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DeliveredById",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DeliveredToCustomerName",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DeliveryNotes",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DeliverySignatureUrl",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DiagnosedAt",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DiagnosedById",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DiagnosisProposedSolution",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "DiagnosisRootCause",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "EstimatedDays",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "TechnicalNotes",
                table: "RepairTickets");

            migrationBuilder.DropColumn(
                name: "Action",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "ActorId",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "ActorName",
                table: "RepairStatusHistories");

            migrationBuilder.DropColumn(
                name: "Details",
                table: "RepairStatusHistories");

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "RepairStatusHistories",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
