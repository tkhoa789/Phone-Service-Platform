using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace PSP.API.Middlewares;

/// <summary>
/// Middleware tự động tiêm các Security Response Headers đạt chuẩn OWASP vào mọi HTTP Response.
/// Chống các đòn tấn công Clickjacking, MIME Sniffing, XSS và Man-in-the-Middle.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Chống Clickjacking (Không cho phép nhúng ứng dụng vào <iframe> lạ)
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // 2. Chống MIME-type Sniffing (Ép trình duyệt tuân thủ MIME type công bố)
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        // 3. Kích hoạt bộ lọc XSS tích hợp của Trình duyệt
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

        // 4. Kiểm soát thông tin Referrer khi chuyển hướng liên kết
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // 5. Thêm Content Security Policy (CSP) phòng thủ XSS & Data Injection
        context.Response.Headers["Content-Security-Policy"] = 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' data: https://fonts.gstatic.com; " +
            "img-src 'self' data: blob: https:; " +
            "connect-src 'self' http: https: ws: wss:;";

        await _next(context);
    }
}
