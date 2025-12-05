using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalFieldsToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "AttendanceRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApproverId",
                table: "AttendanceRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApproverName",
                table: "AttendanceRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FixReason",
                table: "AttendanceRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerNote",
                table: "AttendanceRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ManualCheckIn",
                table: "AttendanceRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ManualCheckOut",
                table: "AttendanceRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AttendanceRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ApproverId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ApproverName",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "FixReason",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ManagerNote",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ManualCheckIn",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ManualCheckOut",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AttendanceRecords");
        }
    }
}
