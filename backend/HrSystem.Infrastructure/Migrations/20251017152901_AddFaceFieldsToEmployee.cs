using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFaceFieldsToEmployee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FaceEmbedding",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FaceProfileUrl",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FaceEmbedding",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FaceProfileUrl",
                table: "Employees");
        }
    }
}
