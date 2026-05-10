Stop rebalancer services using Docker Compose from the `src/` directory.

The argument is optional. Valid values: `all`, `frontend`, `backend`. Default to `all` if no argument is given.

- `all` (or no argument): run `docker-compose down` — stops and removes all containers
- `frontend`: run `docker-compose stop frontend` — stops only the frontend container
- `backend`: run `docker-compose stop backend` — stops only the backend container (leaves db running)

To also wipe the database volume (full reset), the user must explicitly say "reset" or "wipe db" — in that case run `docker-compose down -v` and warn that all data will be lost.

Always run the command from the `src/` directory.

Argument: $ARGUMENTS
