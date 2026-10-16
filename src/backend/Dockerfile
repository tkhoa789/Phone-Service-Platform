FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["PSP.API/PSP.API.csproj", "PSP.API/"]
COPY ["PSP.Application/PSP.Application.csproj", "PSP.Application/"]
COPY ["PSP.Domain/PSP.Domain.csproj", "PSP.Domain/"]
COPY ["PSP.Infrastructure/PSP.Infrastructure.csproj", "PSP.Infrastructure/"]
RUN dotnet restore "PSP.API/PSP.API.csproj"
COPY . .
WORKDIR "/src/PSP.API"
RUN dotnet build "PSP.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PSP.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Harden: Run as non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["dotnet", "PSP.API.dll"]
