# Health Matters KPI Dashboard - Implementation Steps

This file documents what was implemented so far, in order, for the local full-stack assignment project.

## 1. Repository and Branch Setup

1. Confirmed actual git repo path: `E:\agile-kpi-health-matters\health-matters-kpi-dashboard`.
2. Created feature branch:
   - `feat/health-matters-kpi-dashboard`

## 2. Project Scaffold Created

Created the requested structure:

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
  .gitignore
```

## 3. Backend and Database Implementation

## 3.1 SQLite setup

Implemented database logic in `backend/db.js`:

1. Creates `database/` directory if missing.
2. Uses SQLite database file: `database/database.sqlite`.
3. Creates tables:
   - `referrals (id, submitted_at, status)`
   - `appointments (id, referral_id, appointment_date)`
   - `outcomes (id, referral_id, outcome_status)`
4. Seeds sample data automatically on first run if `referrals` is empty.
5. Exposes helpers: `run`, `get`, `all`, `initDatabase`, `closeDatabase`.

## 3.2 Express server

Implemented in `backend/server.js`:

1. Express app with JSON + CORS middleware.
2. API routes mounted at `/api`.
3. Health endpoint: `GET /api/health`.
4. Serves frontend static files from `frontend/`.
5. Root route serves dashboard page (`/` -> `frontend/index.html`).
6. Port configuration:
   - `const PORT = Number(process.env.PORT) || 3000`

## 3.3 API routes

Implemented in `backend/routes/kpiRoutes.js`:

1. `GET /api/kpis/summary`
   - Returns:
     - `total_referrals`
     - `average_sla_days`
   - SLA = difference between `appointments.appointment_date` and `referrals.submitted_at`.

2. `GET /api/kpis/outcomes`
   - Returns grouped counts by `outcome_status`.

3. `GET /api/mi/export`
   - Returns CSV for referral + appointment + outcome data.
   - Includes CSV escaping for commas/quotes/newlines.

4. `GET /api/kpis/referrals` (added later for interactive UI)
   - Returns row-level detailed records:
     - `referral_id`
     - `submitted_at`
     - `referral_status`
     - `appointment_date`
     - `outcome_status`
     - `sla_days`

## 4. Frontend Dashboard Implementation

## 4.1 Initial dashboard

Initial UI displayed:

1. Total referrals
2. Average SLA
3. Outcome statistics table

Data loaded using `fetch()` from API.

## 4.2 Localhost-serving updates

To support opening via localhost:

1. Frontend files served by Express at `/`.
2. `script.js` uses dynamic API base:
   - Same-origin when opened via HTTP
   - Fallback to `http://localhost:3000/api` for file-open mode

## 4.3 Interactive controls added

Expanded dashboard with working buttons:

1. `Refresh Dashboard`
2. `Load/Hide Referral Details`
3. `Download MI CSV`
4. `Sort Outcomes (Asc/Desc)`
5. `Clear Filter`
6. Per-row `Filter Details` buttons in outcomes table

Added referral details section with filter-aware table.

## 4.4 Chart section added (Vanilla JS, no chart library)

Added:

1. Outcomes bar chart (`<canvas>`)
2. Outcomes donut chart (`<canvas>`)
3. Clickable legend chips:
   - `Show All`
   - Per-outcome filter chips (e.g., accepted/pending/rejected)

Charts redraw on window resize and when data refreshes.

## 5. Testing Implementation

Implemented Jest + Supertest tests in `backend/tests/api.test.js`:

1. `GET /api/kpis/summary` returns expected fields/types.
2. `GET /api/kpis/outcomes` returns grouped data array.
3. `GET /api/mi/export` returns CSV content type and header row.
4. `GET /api/kpis/referrals` returns detailed row fields.

All tests currently pass.

## 6. Package and Documentation

Updated `package.json`:

1. Scripts:
   - `start`: `node backend/server.js`
   - `test`: `jest --runInBand`
2. Dependencies:
   - `express`, `cors`
3. Dev dependencies:
   - `jest`, `supertest`
4. Node engine:
   - `>=22.5.0`

Updated `README.md` with:

1. Purpose and stack
2. Setup instructions
3. Run server instructions
4. Alternate port instructions
5. Test instructions

Added `.gitignore`:

1. `node_modules/`
2. `coverage/`

## 7. Environment/Runtime Issue and Resolution

Issue encountered:

1. `sqlite3` package failed to install due to native build/toolchain requirements on local Windows environment.

Resolution applied:

1. Switched database layer to Node built-in `node:sqlite`.
2. Kept SQLite file-based local DB behavior.
3. Avoided external cloud services and kept local-first requirements.

Note:

1. `node:sqlite` currently shows an experimental warning in Node runtime output.

## 8. Localhost and Process Troubleshooting Done

Observed problem:

1. Buttons appeared non-functional due to `Error: Request failed for /kpis/referrals`.
2. Cause was stale/old backend process still running without newest route.

Fix:

1. Restarted server with latest code.
2. Verified route availability (`/api/kpis/referrals`).
3. Improved frontend API error message to include HTTP status and short server response.

## 9. Current Run Instructions

From project root:

```powershell
cd E:\agile-kpi-health-matters\health-matters-kpi-dashboard
npm install
```

Run on default port:

```powershell
node backend/server.js
```

Run on custom port (example `3001`):

```powershell
$env:PORT=3001
node backend/server.js
```

Open:

1. `http://localhost:3001` (or your chosen port)
2. Hard refresh browser if needed: `Ctrl + F5`

Run tests:

```powershell
npm test
```

## 10. Status Summary

The project currently includes:

1. Complete local backend + SQLite database
2. Required KPI endpoints + CSV export
3. Interactive frontend dashboard with buttons
4. Additional referral details endpoint and table
5. Bar + donut charts in pure Vanilla JS
6. Passing Jest/Supertest API tests

