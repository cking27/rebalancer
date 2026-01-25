# Rebalancer

A portfolio rebalancing application that helps you track your investment accounts and compare your actual asset allocation against target models.

## Features

- **Account Management**: Track multiple accounts across different institutions (brokerage, 401k, IRA, etc.)
- **Position Tracking**: Manage positions within accounts with support for various asset types (stocks, ETFs, mutual funds, bonds, cash)
- **Asset Categories**: Hierarchical category system (e.g., Equity → US Equity, International Equity)
- **Model Portfolios**: Define target allocation models with hierarchical percentages
- **Portfolio Comparison**: Compare your actual allocation against target models with buy/sell recommendations
- **Multi-Account Support**: Aggregate positions across multiple accounts for a unified view

## Architecture

- **Backend**: .NET 6 Web API with Entity Framework Core and PostgreSQL
- **Frontend**: Next.js 14 with React, TypeScript, and Tailwind CSS
- **Database**: PostgreSQL 13
- **Containerization**: Docker & Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (v20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 or later)

That's it! Docker handles all other dependencies (.NET SDK, Node.js, PostgreSQL).

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rebalancer.git
   cd rebalancer
   ```

2. **Start all services**
   ```bash
   cd src
   docker-compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api
   - Swagger UI: http://localhost:5001/swagger

The first startup may take a few minutes as Docker downloads images and installs dependencies.

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js development server |
| backend | 5001 | .NET Web API |
| db | 5432 | PostgreSQL database |

## Development

### Running with Docker Compose (Recommended)

```bash
cd src
docker-compose up
```

This starts all services with hot-reload enabled:
- Backend: Uses `dotnet watch` for automatic recompilation
- Frontend: Uses Next.js dev server with fast refresh

### Stopping Services

```bash
docker-compose down
```

To also remove the database volume (fresh start):
```bash
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Running Without Docker

If you prefer to run services locally:

**Backend** (requires .NET 6 SDK):
```bash
cd src/backend
dotnet restore
dotnet run --project rebalancer.API
```

**Frontend** (requires Node.js 18+):
```bash
cd src/frontend/rebalancer-app
npm install
npm run dev
```

**Database**: You'll need a PostgreSQL instance. Update the connection string in `appsettings.json`.

## Project Structure

```
rebalancer/
├── src/
│   ├── backend/
│   │   ├── rebalancer.API/          # Web API controllers and DTOs
│   │   ├── rebalancer.Domain/       # Domain entities and interfaces
│   │   ├── rebalancer.Infrastructure/ # EF Core DbContext and repositories
│   │   └── UnitTests/               # Unit tests
│   ├── frontend/
│   │   └── rebalancer-app/          # Next.js application
│   └── docker-compose.yml
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/Person` | List all people (account owners) |
| `GET /api/Institution` | List all financial institutions |
| `GET /api/Account` | List all accounts |
| `GET /api/Account/{id}/positions` | Get account with positions |
| `GET /api/Position` | List all positions |
| `GET /api/AssetCategory` | List asset categories |
| `GET /api/AssetCategory/tree` | Get categories as hierarchy |
| `GET /api/Model` | List allocation models |
| `POST /api/Model/{id}/compare` | Compare portfolio to model |

## Troubleshooting

### "Failed to load" errors in frontend
This is usually a CORS issue. Ensure the backend is running and check that your frontend port (3000 or 3001) is allowed in `Program.cs`.

### Database connection errors
Ensure PostgreSQL is running:
```bash
docker-compose ps
```

### Port already in use
If port 3000 is in use, Next.js will automatically try 3001. Update your browser URL accordingly.

### Cache issues / weird build errors
Clear the Next.js cache:
```bash
rm -rf src/frontend/rebalancer-app/.next
docker-compose restart frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
