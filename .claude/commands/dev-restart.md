Restart rebalancer services by running `docker-compose down` then `docker-compose up` from the `src/` directory.

The argument is optional. Valid values: `all`, `frontend`, `backend`. Default to `all` if no argument is given.

- `all` (or no argument): stop all containers, then start db, backend, and frontend with hot-reload
- `frontend`: run `docker-compose stop frontend` then `docker-compose up frontend`
- `backend`: run `docker-compose stop backend` then `docker-compose up backend db`

Always run commands from the `src/` directory. Run `up` in the foreground so logs are visible, unless the user explicitly asks for background.

After starting, tell the user which URLs are available:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Swagger: http://localhost:5001/swagger

Argument: $ARGUMENTS
