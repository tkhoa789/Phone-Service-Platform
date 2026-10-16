using FluentValidation.TestHelper;
using PSP.Application.Modules.Warranty.Commands;
using PSP.Application.Modules.Warranty.Queries;
using PSP.Application.Modules.Warranty.Validators;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class WarrantyValidatorUnitTests
{
    private readonly CheckWarrantyStatusQueryValidator _validator;

    public WarrantyValidatorUnitTests()
    {
        _validator = new CheckWarrantyStatusQueryValidator();
    }

    [Theory]
    [InlineData("860123455442088")]
    [InlineData("86012-34554-42088")]
    [InlineData("860 123 455 442 088")]
    [InlineData("IMEI1234567890")]
    public void Validate_ValidImeiFormats_PassesValidation(string imei)
    {
        // Arrange
        var query = new CheckWarrantyStatusQuery(imei);

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Imei);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyOrNullImei_FailsWithRequiredMessage(string? imei)
    {
        // Arrange
        var query = new CheckWarrantyStatusQuery(imei!);

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Imei);
    }

    [Theory]
    [InlineData("12345")] // Too short (< 14 chars)
    [InlineData("1234567890123")] // 13 chars
    [InlineData("1234567890123456789")] // Too long (19 chars)
    public void Validate_ImeiLengthOutOfRange_FailsValidation(string imei)
    {
        // Arrange
        var query = new CheckWarrantyStatusQuery(imei);

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Imei);
    }

    [Theory]
    [InlineData("86012345' OR '1'='1")]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("86012345@#$1234")]
    public void Validate_SpecialCharactersOrInjectionAttempts_FailsValidation(string imei)
    {
        // Arrange
        var query = new CheckWarrantyStatusQuery(imei);

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Imei);
    }

    [Fact]
    public void RejectWarrantyCommandValidator_ValidCommand_PassesValidation()
    {
        var validator = new RejectWarrantyCommandValidator();
        var cmd = new RejectWarrantyCommand(
            Guid.NewGuid(),
            PSP.Domain.Common.Enums.RejectReason.WaterDamage,
            "Quỳ tím đổi màu đỏ đậm tại khay SIM và mainboard",
            "http://example.com/photo.jpg",
            false,
            new byte[] { 1, 2, 3 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void RejectWarrantyCommandValidator_EmptyNotesOrRowVersion_FailsValidation()
    {
        var validator = new RejectWarrantyCommandValidator();
        var cmd = new RejectWarrantyCommand(
            Guid.Empty,
            PSP.Domain.Common.Enums.RejectReason.Dropped,
            "",
            null,
            false,
            Array.Empty<byte>()
        );

        var result = validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.WarrantyTicketId);
        result.ShouldHaveValidationErrorFor(x => x.RejectNotes);
        result.ShouldHaveValidationErrorFor(x => x.RowVersion);
    }

    [Fact]
    public void TransferToInHouseRepairCommandValidator_ValidCommand_PassesValidation()
    {
        var validator = new TransferToInHouseRepairCommandValidator();
        var cmd = new TransferToInHouseRepairCommand(
            Guid.NewGuid(),
            "Hỏng IC hiển thị màn hình, cần thay cụm màn hình",
            Guid.NewGuid(),
            new byte[] { 1, 2, 3 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void TransferToInHouseRepairCommandValidator_EmptyDiagnosis_FailsValidation()
    {
        var validator = new TransferToInHouseRepairCommandValidator();
        var cmd = new TransferToInHouseRepairCommand(
            Guid.NewGuid(),
            "   ",
            null,
            new byte[] { 1 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.ComponentDiagnosis);
    }

    [Fact]
    public void ReplaceDeviceCommandValidator_ValidCommand_PassesValidation()
    {
        var validator = new ReplaceDeviceCommandValidator();
        var cmd = new ReplaceDeviceCommand(
            Guid.NewGuid(),
            "860123469903945",
            "Lỗi chết nguồn đột ngột không thể phục hồi",
            new byte[] { 1, 2 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ReplaceDeviceCommandValidator_InvalidImei_FailsValidation()
    {
        var validator = new ReplaceDeviceCommandValidator();
        var cmd = new ReplaceDeviceCommand(
            Guid.NewGuid(),
            "123", // Too short
            null,
            new byte[] { 1 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.NewImei);
    }

    [Fact]
    public void SendToVendorCommandValidator_ValidCommand_PassesValidation()
    {
        var validator = new SendToVendorCommandValidator();
        var cmd = new SendToVendorCommand(
            Guid.NewGuid(),
            "Trung tâm Bảo hành Ủy quyền Apple (Thakral One)",
            "APL-RMA-2026-9901",
            "VNPOST-8877665544",
            "Gửi thẩm định lỗi camera periscope",
            new byte[] { 1, 2 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void SendToVendorCommandValidator_EmptyFields_FailsValidation()
    {
        var validator = new SendToVendorCommandValidator();
        var cmd = new SendToVendorCommand(
            Guid.NewGuid(),
            "",
            "",
            "",
            null,
            Array.Empty<byte>()
        );

        var result = validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.VendorName);
        result.ShouldHaveValidationErrorFor(x => x.VendorTicketNumber);
        result.ShouldHaveValidationErrorFor(x => x.TrackingNumber);
        result.ShouldHaveValidationErrorFor(x => x.RowVersion);
    }

    [Fact]
    public void DeliverToCustomerCommandValidator_ValidCommand_PassesValidation()
    {
        var validator = new DeliverToCustomerCommandValidator();
        var cmd = new DeliverToCustomerCommand(
            Guid.NewGuid(),
            "Nguyễn Văn A",
            "Khách đã kiểm tra máy hoạt động tốt, nhận lại máy và ký biên bản",
            new byte[] { 1, 2 }
        );

        var result = validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }
}

