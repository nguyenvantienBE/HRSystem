using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrSystem.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeSalaryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Allowance",
                table: "Employees",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseSalary",
                table: "Employees",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Allowance",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "BaseSalary",
                table: "Employees");
        }
    }
}
