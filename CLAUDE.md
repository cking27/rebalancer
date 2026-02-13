# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Rebalancer - an investment tracking application that compares actual asset allocation against target models to generate rebalancing recommendations.

## Build & Run Commands

### Full Stack (Docker - Recommended)
```bash
cd src
docker-compose up          # Start all services with hot-reload
docker-compose down        # Stop services
docker-compose down -v     # Stop and remove database volume
docker-compose logs -f backend  # View backend logs
```

### Backend Only (requires .NET 6 SDK)
```bash
cd src/backend
dotnet restore
dotnet run --project rebalancer.API
dotnet watch --project rebalancer.API/rebalancer.API.csproj run  # Hot reload
dotnet test                # Run all tests
dotnet test --filter "FullyQualifiedName~TestMethodName"  # Single test
```

### Frontend Only (requires Node.js 18+)
```bash
cd src/frontend/rebalancer-app
npm install
npm run dev                # Development server
npm run build              # Production build
npm run prettier:check     # Check formatting
npm run prettier           # Fix formatting
```

## Architecture

### Backend (.NET 6)

Clean architecture with three layers:

- **rebalancer.API** - REST controllers, DTOs, dependency injection setup
- **rebalancer.Domain** - Domain entities and repository interfaces (no external dependencies)
- **rebalancer.Infrastructure** - EF Core DbContext, repository implementations, database mappings

Domain entities use DDD patterns: private setters, explicit constructors, and Update methods for modifications.

### Domain Model

The core entities and their relationships:
- **Person** - Account owners
- **Institution** - Financial institutions (Fidelity, Vanguard, etc.)
- **Account** - Belongs to a Person at an Institution, has AccountType (Brokerage, K401, IRA, etc.)
- **Security** - Centrally-defined assets with ticker, PositionType (ETF, Stock, etc.), AssetClass, and optional AssetCategory
- **Holding** - Links Account to Security with shares and price (value is computed as shares × price)
- **AssetCategory** - Hierarchical categories (e.g., Equity → US Large Cap → US Large Cap Growth)
- **Model** - Target allocation model with ModelAllocation entries mapping AssetCategories to target percentages

### Frontend (Next.js 14)

- App Router structure under `app/`
- Dashboard pages at `app/dashboard/[feature]/page.tsx`
- API client functions in `app/lib/api.ts`
- TypeScript types in `app/lib/definitions.ts`
- TailwindCSS for styling

### Key API Endpoints

- `POST /api/Model/{id}/compare` - Compare portfolio against a model, returns rebalancing recommendations per account
- `GET /api/Allocation?accountIds=1&accountIds=2` - Aggregate allocation summary across selected accounts
- `GET /api/Account/{id}/holdings` - Account with all holdings (includes Security details)

## Database

PostgreSQL with EF Core. Schema auto-creates on startup via `db.Database.EnsureCreated()`.

Table naming: snake_case (e.g., `asset_categories`, `model_allocations`). Column mapping defined in `RebalancerDbContext.OnModelCreating()`.

## Testing

Backend uses xUnit. Test project at `src/backend/UnitTests/`.
