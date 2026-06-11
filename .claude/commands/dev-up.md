Start rebalancer services using Docker Compose from the `src/` directory.

The argument is optional. Valid values: `all`, `frontend`, `backend`. Default to `all` if no argument is given.

- `all` (or no argument): run `docker-compose up` — starts db, backend, and frontend with hot-reload
- `frontend`: run `docker-compose up frontend` — starts only the frontend container
- `backend`: run `docker-compose up backend db` — starts the backend and its database dependency

Always run the command from the `src/` directory. Use `-d` flag only if the user explicitly asks to run in the background; otherwise run in the foreground so logs are visible.

After starting, tell the user which URLs are available:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Swagger: http://localhost:5001/swagger

Argument: $ARGUMENTS
