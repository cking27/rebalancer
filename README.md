# Rebalancer

Rebalancer is a powerful application designed to autorebalance your accounts to meet an optimal asset allocation. This repository contains both the backend and frontend of the application.

## Features

- Feature 1
- Feature 2
- Feature 3

(Replace the above with the actual features of your application.)

## Architecture

The application is divided into two main parts:

- **Backend**: A .NET application that handles all the server-side logic.
- **Frontend**: A (frontend technology) application that provides the user interface.  React

(Replace "(frontend technology)" with the actual technology you're using for the frontend.)

## Getting Started

### Backend

The backend is a .NET application. To run it in a Docker container, use the following command:

```bash
#How to Run backend.
docker run -p 5000:80 -v /Users/charlesking/Development/rebalancer/src/backend:/app -w /app mcr.microsoft.com/dotnet/sdk:6.0 /bin/bash -c "dotnet restore && dotnet watch --project rebalancer.API/rebalancer.API.csproj run --no-restore"
```
## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions, feel free to reach out to us.

## Acknowledgements

(Include any acknowledgements, if applicable.)



