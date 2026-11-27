# Sentinel GNN - frontend

React 18 + TypeScript + Vite + Tailwind + Recharts + Cytoscape.js dashboard for the FastAPI backend (`../backend`). No mock data: every number comes from an API call; failures show error / unavailable states.

## Run (PowerShell, from the project root)
```powershell
# 1. backend (separate terminal)
cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
# 2. frontend
cd frontend
npm install
copy .env.example .env      # VITE_API_BASE_URL=http://localhost:8000
npm run dev                 # http://localhost:5173  (allowed by the backend's default CORS list)
```
Build: `npm run build` (output in `dist/`). Typecheck: `npm run typecheck`.

## Pages
Overview · Transaction Explorer · Fraud Prediction (existing transaction + CSV batch) · Graph Explorer (Cytoscape, bounded neighbourhoods, double-click to expand) · Model Performance (+ compatibility report) · Fraud Alerts.

## Behaviour worth knowing
- **Model availability** comes from the backend's compatibility verification (`GET /api/v1/predictions/models`). The first call can take a while. Unavailable models show the backend's exact reasons and cannot be run.
- Ground-truth labels (`GT` badge) and model predictions (`AI` badge) are always shown separately.
- The Overview fraud-trend chart is assembled from 49 small real queries (the backend has no trend endpoint).
- The transaction list cannot filter by prediction (not supported by the backend); predictions appear in the detail panel.
- Alerts have no acknowledgement state (the backend keeps none) and stored-output alerts have no timestamp.
- CSV: graph models take `txId` only; tabular baselines need the full feature columns (see the prediction page hints).

## Tests
```powershell
npm test                                   # 23 unit/component/page tests (API layer mocked)
$env:INTEGRATION_API_URL="http://localhost:8000"; npm run test:integration   # 6 tests against a RUNNING backend
```
