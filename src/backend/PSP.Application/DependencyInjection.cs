using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using PSP.Application.Common.Behaviors;

namespace PSP.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        services.AddScoped<PSP.Application.Common.Interfaces.IScopeContextService, PSP.Application.Common.Security.ScopeContextService>();
        services.AddScoped<PSP.Application.Common.Interfaces.IFieldVisibilityService, PSP.Application.Common.Security.FieldVisibilityService>();
        services.AddScoped<PSP.Application.Common.Interfaces.IAIAuthorizationService, PSP.Application.Common.Security.AIAuthorizationService>();

        return services;
    }
}
