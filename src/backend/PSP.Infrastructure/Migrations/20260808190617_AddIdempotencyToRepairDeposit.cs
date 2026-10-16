using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIdempotencyToRepairDeposit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "RepairDeposits",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestPayloadHash",
                table: "RepairDeposits",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RepairDeposits_IdempotencyKey",
                table: "RepairDeposits",
                column: "IdempotencyKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepairDeposits_IdempotencyKey",
                table: "RepairDeposits");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "RepairDeposits");

            migrationBuilder.DropColumn(
                name: "RequestPayloadHash",
                table: "RepairDeposits");
        }
    }
}
