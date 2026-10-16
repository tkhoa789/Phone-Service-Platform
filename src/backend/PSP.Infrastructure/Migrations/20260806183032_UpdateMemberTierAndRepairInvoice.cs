using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMemberTierAndRepairInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Suppliers",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DebtAmount",
                table: "Suppliers",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PaymentTermsDays",
                table: "Suppliers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TaxCode",
                table: "Suppliers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SalesOrderId",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "RepairTicketId",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MemberTier",
                table: "Customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RewardPoints",
                table: "Customers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalSpent",
                table: "Customers",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "SupplierDebtTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ReferenceNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierDebtTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierDebtTransactions_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_RepairTicketId",
                table: "Invoices",
                column: "RepairTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierDebtTransactions_SupplierId",
                table: "SupplierDebtTransactions",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_RepairTickets_RepairTicketId",
                table: "Invoices",
                column: "RepairTicketId",
                principalTable: "RepairTickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_RepairTickets_RepairTicketId",
                table: "Invoices");

            migrationBuilder.DropTable(
                name: "SupplierDebtTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_RepairTicketId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "DebtAmount",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "PaymentTermsDays",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "TaxCode",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "RepairTicketId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "MemberTier",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "RewardPoints",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "TotalSpent",
                table: "Customers");

            migrationBuilder.AlterColumn<Guid>(
                name: "SalesOrderId",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
