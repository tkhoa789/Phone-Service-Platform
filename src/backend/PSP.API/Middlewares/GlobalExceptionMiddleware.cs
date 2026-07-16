using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using PSP.Application.Common.Models;
using PSP.Domain.Common.Exceptions;
using FluentValidation;

namespace PSP.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, code, message) = exception switch
        {
            NotFoundException e => ((int)HttpStatusCode.NotFound, e.ErrorCode, e.Message),
            ConflictException e => ((int)HttpStatusCode.Conflict, e.ErrorCode, e.Message),
            UnauthorizedException e => ((int)HttpStatusCode.Unauthorized, e.ErrorCode, e.Message),
            ForbiddenException e => ((int)HttpStatusCode.Forbidden, e.ErrorCode, e.Message),
            BadRequestException e => ((int)HttpStatusCode.BadRequest, e.ErrorCode, e.Message),
            BusinessException e => ((int)HttpStatusCode.BadRequest, e.ErrorCode, e.Message),
            ValidationException e => ((int)HttpStatusCode.BadRequest, "VALIDATION_ERROR", string.Join("; ", e.Errors.Select(x => x.ErrorMessage))),
            _ => ((int)HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR", "Đã xảy ra lỗi hệ thống.")
        };

        context.Response.StatusCode = statusCode;

        var response = ApiResponse<object>.Fail(code, message);

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        var result = JsonSerializer.Serialize(response, options);
        return context.Response.WriteAsync(result);
    }
}
