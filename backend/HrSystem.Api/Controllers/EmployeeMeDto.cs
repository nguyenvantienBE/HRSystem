namespace HrSystem.Api.Dtos;

public class EmployeeMeDto
{
    public string? FullName { get; set; }
    public string? Phone    { get; set; }
    // Nếu muốn cho phép thêm: AvatarUrl, Address,... thì khai báo ở đây
}
