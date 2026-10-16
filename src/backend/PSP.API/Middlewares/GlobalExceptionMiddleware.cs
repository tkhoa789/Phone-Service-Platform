using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PSP.Application.Common.Models;
using PSP.Domain.Common.Exceptions;
using FluentValidation;

namespace PSP.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier;
            
            // Structured logging of the exception
            _logger.LogError(ex, "An unhandled exception has occurred while executing the request. TraceId: {TraceId}", traceId);
            
            await HandleExceptionAsync(context, ex, traceId);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, string traceId)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, code, message) = exception switch
        {
            NotFoundException e => ((int)HttpStatusCode.NotFound, e.ErrorCode, e.Message),
            KeyNotFoundException e => ((int)HttpStatusCode.NotFound, "NOT_FOUND", e.Message),
            ConflictException e => ((int)HttpStatusCode.Conflict, e.ErrorCode, e.Message),
            UnauthorizedException e => ((int)HttpStatusCode.Unauthorized, e.ErrorCode, e.Message),
            ForbiddenException e => ((int)HttpStatusCode.Forbidden, e.ErrorCode, e.Message),
            BadRequestException e => ((int)HttpStatusCode.BadRequest, e.ErrorCode, e.Message),
            BusinessException e => ((int)HttpStatusCode.BadRequest, e.ErrorCode, e.Message),
            ValidationException e => ((int)HttpStatusCode.BadRequest, "VALIDATION_ERROR", string.Join("; ", e.Errors.Select(x => x.ErrorMessage))),
            Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException e => ((int)HttpStatusCode.Conflict, "CONCURRENCY_ERROR", "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại và thử lại."),
            _ => ((int)HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR", "Đã xảy ra lỗi hệ thống.")
        };

        context.Response.StatusCode = statusCode;

        var response = ApiResponse<object>.Fail(code, message, traceId);

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        var result = JsonSerializer.Serialize(response, options);
        return context.Response.WriteAsync(result);
    }
}
