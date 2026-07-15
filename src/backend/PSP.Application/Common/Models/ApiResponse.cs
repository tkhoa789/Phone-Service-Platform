namespace PSP.Application.Common.Models;

public class ApiResponse<T>
{
    public string Code { get; set; } = "SUCCESS";
    public string Message { get; set; } = "Thành công";
    public T? Data { get; set; }

    public static ApiResponse<T> Success(T data, string message = "Thành công") => 
        new() { Data = data, Message = message };

    public static ApiResponse<T> Fail(string code, string message) => 
        new() { Code = code, Message = message, Data = default };
}
