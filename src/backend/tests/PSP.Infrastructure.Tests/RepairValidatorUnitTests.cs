using System;
using FluentValidation.TestHelper;
using PSP.Application.Modules.Repair.Commands;
using PSP.Application.Modules.Repair.Validators;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class RepairValidatorUnitTests
{
    private readonly CreateRepairTicketCommandValidator _validator;

    public RepairValidatorUnitTests()
    {
        _validator = new CreateRepairTicketCommandValidator();
    }

    [Theory]
    [InlineData("Màn hình bị nứt kính cảm ứng")]
    [InlineData("Thay pin dung lượng cao")]
    [InlineData("Lỗi sạc")]
    public void Validate_ValidProblemDescription_PassesValidation(string problemDesc)
    {
        // Arrange
        var command = new CreateRepairTicketCommand(
            CustomerId: Guid.NewGuid(),
            ProductVariantId: Guid.NewGuid(),
            Imei: "860123456789012",
            ProblemDescription: problemDesc,
            EstimatedCost: 500000,
            TechnicianId: Guid.NewGuid(),
            ExteriorCondition: "Trầy viền nhẹ",
            CustomModelName: "Custom Device Model"
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.ProblemDescription);
        result.ShouldNotHaveValidationErrorFor(x => x.ExteriorCondition);
        result.ShouldNotHaveValidationErrorFor(x => x.CustomModelName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("k")]
    [InlineData("c")]
    [InlineData("12")]
    public void Validate_EmptyOrTooShortProblemDescription_FailsValidation(string invalidDesc)
    {
        // Arrange
        var command = new CreateRepairTicketCommand(
            CustomerId: Guid.NewGuid(),
            ProductVariantId: Guid.NewGuid(),
            Imei: "860123456789012",
            ProblemDescription: invalidDesc,
            EstimatedCost: 100000,
            TechnicianId: null
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.ProblemDescription);
    }

    [Fact]
    public void Validate_ExteriorConditionTooLong_FailsValidation()
    {
        // Arrange: > 500 characters
        var longCondition = new string('A', 501);
        var command = new CreateRepairTicketCommand(
            CustomerId: Guid.NewGuid(),
            ProductVariantId: Guid.NewGuid(),
            Imei: "860123456789012",
            ProblemDescription: "Màn hình liệt cảm ứng",
            EstimatedCost: 100000,
            TechnicianId: null,
            ExteriorCondition: longCondition
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.ExteriorCondition);
    }

    [Fact]
    public void Validate_CustomModelNameTooLong_FailsValidation()
    {
        // Arrange: > 200 characters
        var longModel = new string('M', 201);
        var command = new CreateRepairTicketCommand(
            CustomerId: Guid.NewGuid(),
            ProductVariantId: Guid.NewGuid(),
            Imei: "860123456789012",
            ProblemDescription: "Màn hình liệt cảm ứng",
            EstimatedCost: 100000,
            TechnicianId: null,
            CustomModelName: longModel
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CustomModelName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_NullOrWhitespaceImei_PassesValidation(string? imei)
    {
        // Arrange
        var command = new CreateRepairTicketCommand(
            CustomerId: Guid.NewGuid(),
            ProductVariantId: Guid.NewGuid(),
            Imei: imei,
            ProblemDescription: "Màn hình liệt cảm ứng",
            EstimatedCost: 100000,
            TechnicianId: null
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Imei);
    }
}

