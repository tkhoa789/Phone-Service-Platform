using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using PSP.API.Middlewares;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_NoCorrelationIdHeader_UsesTraceIdentifierAndSetsHeader()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.TraceIdentifier = "ASP_NET_CORE_TRACE_ID";
        context.Response.Body = new MemoryStream();

        var middleware = new CorrelationIdMiddleware(innerHttpContext => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("ASP_NET_CORE_TRACE_ID", context.TraceIdentifier);
        Assert.True(context.Response.Headers.ContainsKey("X-Correlation-ID"));
        Assert.Equal("ASP_NET_CORE_TRACE_ID", context.Response.Headers["X-Correlation-ID"].FirstOrDefault());
    }

    [Fact]
    public async Task InvokeAsync_HasCorrelationIdHeader_OverridesTraceIdentifier()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.TraceIdentifier = "ASP_NET_CORE_TRACE_ID";
        context.Request.Headers["X-Correlation-ID"] = "CLIENT_PROVIDED_ID";
        context.Response.Body = new MemoryStream();

        var middleware = new CorrelationIdMiddleware(innerHttpContext => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("CLIENT_PROVIDED_ID", context.TraceIdentifier);
        Assert.True(context.Response.Headers.ContainsKey("X-Correlation-ID"));
        Assert.Equal("CLIENT_PROVIDED_ID", context.Response.Headers["X-Correlation-ID"].FirstOrDefault());
    }
}
