using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_RepairChecklistAndWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RepairChecklists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RepairTicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    InspectorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InspectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CustomerSignatureUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepairChecklists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RepairChecklists_RepairTickets_RepairTicketId",
                        column: x => x.RepairTicketId,
                        principalTable: "RepairTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RepairChecklists_Users_InspectorId",
                        column: x => x.InspectorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RepairChecklistItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RepairChecklistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CheckPointName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsPassed = table.Column<bool>(type: "bit", nullable: false),
                    IssueDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepairChecklistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RepairChecklistItems_RepairChecklists_RepairChecklistId",
                        column: x => x.RepairChecklistId,
                        principalTable: "RepairChecklists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RepairChecklistItems_RepairChecklistId",
                table: "RepairChecklistItems",
                column: "RepairChecklistId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairChecklists_InspectorId",
                table: "RepairChecklists",
                column: "InspectorId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairChecklists_RepairTicketId",
                table: "RepairChecklists",
                column: "RepairTicketId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RepairChecklistItems");

            migrationBuilder.DropTable(
                name: "RepairChecklists");
        }
    }
}
