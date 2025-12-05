using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrSystem.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOfficeLocationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "RadiusMeters",
                table: "OfficeLocations",
                type: "int",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "OfficeLocations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "OfficeLocations");

            migrationBuilder.AlterColumn<double>(
                name: "RadiusMeters",
                table: "OfficeLocations",
                type: "float",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
