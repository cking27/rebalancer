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
dotnet restore rebalancer.sln
dotnet run --project rebalancer.API
dotnet watch --project rebalancer.API/rebalancer.API.csproj run  # Hot reload
dotnet test                # Run all tests
dotnet test --filter "FullyQualifiedName~TestMethodName"  # Single test
```

### Frontend Only (requires Node.js 18+)
```bash
cd src/frontend/rebalancer-app
npm install
npm run dev                # Development server (http://localhost:3000)
npm run build              # Production build
npm run prettier:check     # Check formatting
npm run prettier           # Fix formatting
```

## Architecture

### Backend (.NET 6)

Three-layer clean architecture:

- **rebalancer.API** - REST controllers, with DTOs colocated in the same file as each controller (not a separate folder)
- **rebalancer.Domain** - Domain entities and repository interfaces (no external dependencies); entities use private setters, explicit constructors, and `Update()` methods for mutation
- **rebalancer.Infrastructure** - EF Core `RebalancerDbContext`, one repository class per aggregate

### Domain Model

- **Person** - Account owners
- **Institution** - Financial institutions
- **Account** - Belongs to a Person at an Institution; has `AccountType` enum (Brokerage, K401, IRA, etc.) and `IsRetirement` flag
- **Security** - Centrally-defined assets with ticker (unique), `PositionType` (ETF, Stock, etc.), `AssetClass`, optional `AssetCategoryId`, and `Price`
- **Holding** - Links Account to Security with `Shares`; `Value` is a computed property (`Shares × Security.Price`) that is ignored by EF Core and requires `Security` to be loaded
- **AssetCategory** - Self-referencing hierarchy via `ParentId`; used to classify securities and define model targets
- **Model** / **ModelAllocation** - Target allocation model; each `ModelAllocation` maps an `AssetCategoryId` to a `TargetPercentage`

### Compare Algorithm (core business logic)

`POST /api/Model/{id}/compare` is the primary feature. Key behaviors:

- **Effective percentage** for a category is computed by multiplying its `TargetPercentage` down the parent chain (e.g., a child at 60% under a parent at 40% → 24% effective target)
- **Leaf allocations** are categories in the model that have no child categories also in the model; only leaves generate Buy/Sell recommendations; non-leaves show Over/Under
- **$10 threshold** — buy/sell recommendations are only generated when `|differenceValue| > 10`
- **Per-account breakdowns** are returned alongside the aggregate comparison; holding-level recommendations are distributed proportionally within each category
- **Unmapped holdings** — securities with no `AssetCategoryId`, or whose category is not covered by the model, are surfaced separately

### Model Allocation Update Pattern

`ModelRepository.UpdateAsync` deletes all existing `ModelAllocation` rows for the model and re-inserts from the entity's current `Allocations` collection. Do not attempt a partial/diff update.

### Price Refresh

`POST /api/Security/refresh-prices` fetches live prices from Yahoo Finance (`query1.finance.yahoo.com/v8/finance/chart/{ticker}`) for all securities and persists them. The `HttpClient` is registered as `"YahooFinance"` in DI.

### Frontend (Next.js 14)

- App Router under `app/`; dashboard features at `app/dashboard/[feature]/page.tsx`
- All API calls go through `app/lib/api.ts` via a shared `fetchApi<T>` wrapper
- TypeScript types in `app/lib/definitions.ts`
- Backend URL configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5001/api`)
- TailwindCSS for styling

## Services & Ports

| Service  | Port | Description               |
|----------|------|---------------------------|
| frontend | 3000 | Next.js dev server        |
| backend  | 5001 | .NET Web API (port 80 in container, mapped to 5001) |
| db       | 5432 | PostgreSQL                |

Swagger UI available at `http://localhost:5001/swagger`.

## Database

PostgreSQL with EF Core. Schema auto-creates on startup via `db.Database.EnsureCreated()` — no migrations. Table names are snake_case; column mappings are defined in `RebalancerDbContext.OnModelCreating()`. To restore from a dump:

```bash
docker-compose exec -T db psql -U postgres -d rebalancer < backup.sql
```

## Testing

xUnit test project at `src/backend/UnitTests/`. Run with `dotnet test` from `src/backend/`.
