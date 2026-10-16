using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace PSP.API.Middlewares;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string CorrelationIdHeaderName = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task InvokeAsync(HttpContext context)
    {
        // Check if the client provided a correlation ID, otherwise use the TraceIdentifier (which is unique per request in ASP.NET Core)
        var correlationId = context.Request.Headers.TryGetValue(CorrelationIdHeaderName, out var values)
            ? values.FirstOrDefault() ?? context.TraceIdentifier
            : context.TraceIdentifier;

        // Ensure the context's TraceIdentifier matches the CorrelationId
        context.TraceIdentifier = correlationId;

        // Add the correlation ID to the response headers so the client can trace it
        if (!context.Response.Headers.ContainsKey(CorrelationIdHeaderName))
        {
            context.Response.Headers.Append(CorrelationIdHeaderName, new StringValues(correlationId));
        }

        return _next(context);
    }
}
