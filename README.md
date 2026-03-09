# Health Matters KPI Dashboard

## Project Purpose
Health Matters KPI Dashboard is a small full-stack university assignment project that simulates an analytics module for a referral management system.

It provides:
- KPI summary metrics
- Outcome statistics
- A CSV MI export endpoint
- A simple frontend dashboard

The project runs fully locally with no cloud services.

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: SQLite
- Testing: Jest, Supertest

## Project Structure
```text
health-matters-kpi-dashboard/
  backend/
    server.js
    db.js
    routes/
      kpiRoutes.js
    tests/
      api.test.js
  frontend/
    index.html
    style.css
    script.js
  database/
    database.sqlite
  package.json
  README.md
```

## Setup Instructions
1. Open a terminal in `health-matters-kpi-dashboard`
2. Use Node.js `22.5+` (this project uses Node's built-in `node:sqlite` module)
3. Install dependencies:

```bash
npm install
```

## Run the Server
```bash
node backend/server.js
```

The API server runs on `http://localhost:3000`.

To run on a different port (example `3001`):

```bash
# PowerShell
$env:PORT=3001
node backend/server.js
```

Sample data is inserted automatically on first run.

## Open the Frontend
Open `frontend/index.html` directly in your browser.

The page fetches KPI data from the local API.

## Run Tests
```bash
npm test
```

The tests use Supertest to validate:
- `GET /api/kpis/summary`
- `GET /api/kpis/outcomes`
- `GET /api/mi/export`
