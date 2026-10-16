using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PSP.API.Middlewares;

/// <summary>
/// Middleware tự động kiểm tra và làm sạch dữ liệu chuỗi đầu vào (Input Sanitization).
/// Loại bỏ các thẻ mã độc HTML/JavaScript (<script>, <iframe>, javascript:, event handlers...)
/// nhằm ngăn ngừa triệt để các lỗ hổng Cross-Site Scripting (XSS).
/// </summary>
public class InputSanitizationMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly Regex XssPattern = new(
        @"<script[^>]*>.*?</script>|<iframe[^>]*>.*?</iframe>|javascript:|onerror=|onload=|eval\(",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public InputSanitizationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Chỉ làm sạch các request có chứa Body dạng JSON hoặc Form
        if ((context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "PATCH") &&
            context.Request.ContentType != null &&
            context.Request.ContentType.Contains("application/json"))
        {
            context.Request.EnableBuffering();

            using var reader = new StreamReader(
                context.Request.Body,
                encoding: Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                leaveOpen: true);

            var bodyText = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (!string.IsNullOrEmpty(bodyText) && XssPattern.IsMatch(bodyText))
            {
                // Thay thế mã độc bằng chuỗi rỗng an toàn
                var sanitizedBody = XssPattern.Replace(bodyText, string.Empty);
                var bytes = Encoding.UTF8.GetBytes(sanitizedBody);
                context.Request.Body = new MemoryStream(bytes);
            }
        }

        await _next(context);
    }
}
