using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_ChecklistUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepairChecklists_RepairTicketId",
                table: "RepairChecklists");

            migrationBuilder.CreateIndex(
                name: "IX_RepairChecklists_RepairTicketId_Type",
                table: "RepairChecklists",
                columns: new[] { "RepairTicketId", "Type" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepairChecklists_RepairTicketId_Type",
                table: "RepairChecklists");

            migrationBuilder.CreateIndex(
                name: "IX_RepairChecklists_RepairTicketId",
                table: "RepairChecklists",
                column: "RepairTicketId");
        }
    }
}
