using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using PSP.Infrastructure.Services.Security;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class HmacTokenServiceTests
{
    private readonly HmacTokenService _service;

    public HmacTokenServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "SuperSecretKeyForTestingPurposes2026_AtLeast32BytesLength!"
            })
            .Build();

        _service = new HmacTokenService(config);
    }

    [Fact]
    public void GenerateSignature_ProducesDeterministicLowercaseHex64()
    {
        var fileId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        long expires = 1800000000;

        var sig1 = _service.GenerateSignature(fileId, expires);
        var sig2 = _service.GenerateSignature(fileId, expires);

        Assert.NotNull(sig1);
        Assert.Equal(64, sig1.Length);
        Assert.Equal(sig1, sig2);
        Assert.Equal(sig1.ToLowerInvariant(), sig1);
    }

    [Fact]
    public void ValidateSignature_WithValidSignature_ReturnsTrue()
    {
        var fileId = Guid.NewGuid();
        long expires = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();

        var sig = _service.GenerateSignature(fileId, expires);
        var isValid = _service.ValidateSignature(fileId, expires, sig);

        Assert.True(isValid);
    }

    [Fact]
    public void ValidateSignature_WithTamperedSignature_ReturnsFalse()
    {
        var fileId = Guid.NewGuid();
        long expires = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();

        var sig = _service.GenerateSignature(fileId, expires);
        var tamperedSig = sig.Substring(0, 63) + (sig.EndsWith("a") ? "b" : "a");

        var isValid = _service.ValidateSignature(fileId, expires, tamperedSig);

        Assert.False(isValid);
    }

    [Fact]
    public void ValidateSignature_WhenExpiredBeyondClockSkew_ReturnsFalse()
    {
        var fileId = Guid.NewGuid();
        // Expired 65 seconds ago (tolerance is 60 seconds)
        long expiredTimestamp = DateTimeOffset.UtcNow.AddSeconds(-65).ToUnixTimeSeconds();

        var sig = _service.GenerateSignature(fileId, expiredTimestamp);
        var isValid = _service.ValidateSignature(fileId, expiredTimestamp, sig);

        Assert.False(isValid);
    }

    [Fact]
    public void ValidateSignature_WithinClockSkewTolerance_ReturnsTrue()
    {
        var fileId = Guid.NewGuid();
        // Expired only 30 seconds ago (within 60s tolerance)
        long expiredWithinTolerance = DateTimeOffset.UtcNow.AddSeconds(-30).ToUnixTimeSeconds();

        var sig = _service.GenerateSignature(fileId, expiredWithinTolerance);
        var isValid = _service.ValidateSignature(fileId, expiredWithinTolerance, sig);

        Assert.True(isValid);
    }

    [Fact]
    public void GeneratePreSignedUrl_ContainsExpiresAndSigParameters()
    {
        var fileId = Guid.NewGuid();

        var url = _service.GeneratePreSignedUrl(fileId, TimeSpan.FromMinutes(15));

        Assert.Contains($"/api/FileAttachment/{fileId}/download?", url);
        Assert.Contains("expires=", url);
        Assert.Contains("sig=", url);
    }
}
