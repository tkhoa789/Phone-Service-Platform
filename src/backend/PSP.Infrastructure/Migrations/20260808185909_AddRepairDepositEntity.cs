using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRepairDepositEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RepairDeposits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RepairTicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReceivedById = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AppliedToInvoiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepairDeposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RepairDeposits_PaymentMethods_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RepairDeposits_RepairTickets_RepairTicketId",
                        column: x => x.RepairTicketId,
                        principalTable: "RepairTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RepairDeposits_Users_ReceivedById",
                        column: x => x.ReceivedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RepairDeposits_PaymentMethodId",
                table: "RepairDeposits",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairDeposits_ReceivedById",
                table: "RepairDeposits",
                column: "ReceivedById");

            migrationBuilder.CreateIndex(
                name: "IX_RepairDeposits_RepairTicketId",
                table: "RepairDeposits",
                column: "RepairTicketId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RepairDeposits");
        }
    }
}
