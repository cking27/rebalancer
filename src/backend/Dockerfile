# Use the official .NET 6.0 SDK image from the Microsoft Container Registry
FROM mcr.microsoft.com/dotnet/sdk:6.0

# Set the working directory
WORKDIR /app

# Set the environment variables
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Expose port 80 for the application
EXPOSE 80

# Run the application using the dotnet watch command for development
CMD ["dotnet", "watch", "--project", "rebalancer.API/rebalancer.API.csproj", "run", "--no-restore"]