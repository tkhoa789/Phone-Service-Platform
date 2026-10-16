using System.IO;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PSP.API.Middlewares;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class GlobalExceptionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WithDbUpdateConcurrencyException_Returns409Conflict_WithTraceId()
    {
        // Arrange
        var middleware = new GlobalExceptionMiddleware(innerHttpContext =>
        {
            throw new DbUpdateConcurrencyException("Concurrency error");
        }, NullLogger<GlobalExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.TraceIdentifier = "TEST_TRACE_123";
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal((int)HttpStatusCode.Conflict, context.Response.StatusCode);
        
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        
        Assert.Contains("CONCURRENCY_ERROR", body);
        Assert.Contains("TEST_TRACE_123", body); // Verify trace ID is returned
    }
}
