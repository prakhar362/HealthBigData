# HealthBig

HealthBig is an academic Big Data Analytics (BDA) project: a web dashboard for exploring a synthetic healthcare cohort, analyzing health and hospital trends, demonstrating machine-learning risk classification, and viewing simulated vital-sign monitoring.

> **Educational use only.** HealthBig's patient records, risk predictions, alert thresholds, and simulated readings are for coursework and software demonstration. They are not medical advice, clinical diagnoses, or a substitute for professional care. Do not upload real patient or other sensitive health information.

## What it does

- **Overview:** summarizes cohort and hospital metrics with interactive charts.
- **Patient management:** search, filter, paginate, add, edit, and remove patient records; inspect associated clinical history.
- **Health analytics:** explore diabetes, demographics, BMI, blood pressure, glucose, and hospital-admission trends.
- **Risk prediction:** compare Logistic Regression, Decision Tree, and Random Forest classifications, with model metrics and feature-importance information.
- **Live monitoring demo:** generates synthetic vital readings in the backend and displays readings and threshold alerts in the dashboard.
- **Data management and reports:** upload CSV or JSON files for a basic data-quality preview, and export analytical reports as CSV or PDF.

The application seeds an empty database with synthetic demo records and trains its classifiers when the backend starts. The monitoring simulator generates readings periodically in the running backend process; this is a demonstration, not a medical telemetry service.

## How it works

```text
Browser (React dashboard)
        | HTTP/JSON requests
        v
FastAPI REST API  <---->  SQLAlchemy  <---->  PostgreSQL or SQLite
        |
        +-- pandas / scikit-learn risk analysis
        +-- background synthetic-vitals simulator
        +-- CSV and PDF report generation
```

The frontend calls the backend's `/api/...` endpoints. FastAPI validates and routes requests to service and analytics code, SQLAlchemy reads and writes the relational data, and scikit-learn runs the risk-classification demo. The monitoring screen polls the API for simulator readings and alerts.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, React Router |
| Backend/API | Python, FastAPI, Pydantic, Uvicorn |
| Data and analytics | SQLAlchemy, SQLite (local fallback), PostgreSQL, pandas, NumPy |
| Machine learning | scikit-learn, joblib |
| Reports | ReportLab (PDF), CSV |

Sample data files are under [`healthbig/backend/datasets`](healthbig/backend/datasets). The backend source is in [`healthbig/backend/app`](healthbig/backend/app), and the dashboard source is in [`healthbig/frontend/src`](healthbig/frontend/src).

## Run locally

Use the combined Windows startup instructions in [`steps.txt`](steps.txt). They install dependencies and start both the API and dashboard with the root-level `run_all.bat` script.

When running locally:

- Dashboard: <http://localhost:5173>
- API status: <http://localhost:8000/>
- Interactive API documentation: <http://localhost:8000/docs>

The backend uses SQLite if PostgreSQL is unavailable. For hosted deployment, configure PostgreSQL rather than relying on a local SQLite file.

## Deploy

The simplest hosted setup is **the frontend on Vercel and the API on Render**, connected through the frontend's `VITE_API_URL` environment variable. You can also host both services on Render. Since this repository is a monorepo, set each service's root directory as shown below.

### 1. Deploy the backend to Render

1. Push the repository to GitHub and create a **Web Service** in Render connected to it.
2. Set **Root Directory** to `healthbig/backend`.
3. Use these commands:

   | Setting | Value |
   |---|---|
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. Create a PostgreSQL database (Render PostgreSQL or another hosted PostgreSQL provider). Set the web service's `DATABASE_URL` to that database's connection URL. Render's internal URL is appropriate when both services are in the same Render region; use an externally reachable URL if the database is elsewhere.
5. Deploy, then check `https://<your-render-service>.onrender.com/` and `/docs`.

The backend falls back to a local SQLite file if it cannot connect to PostgreSQL. Hosted service filesystems may be temporary, so that fallback is not suitable for durable production data. The simulator's in-memory state also belongs to one running process and is not shared across instances.

### 2. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `healthbig/frontend` and select the Vite framework preset.
3. Set the build command to `npm run build` and the output directory to `dist` (Vercel usually detects these automatically).
4. Add this frontend environment variable:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com` |

   Use the deployed backend's base URL only, with no trailing slash or `/api` suffix. Vite embeds this value at build time.
5. Deploy or redeploy the frontend after setting the variable. Open the Vercel URL and verify that the dashboard can reach the API.

The frontend uses React Router. If direct visits or page refreshes on paths such as `/patients` return a Vercel 404, add `healthbig/frontend/vercel.json` with this content, then redeploy:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Host both services on Render

Create one Render Web Service for the backend using the settings above, plus one **Static Site** with root directory `healthbig/frontend`, build command `npm install && npm run build`, and publish directory `dist`. Set `VITE_API_URL` to the backend URL in the static site's environment settings, and rebuild after changing it. Keep the PostgreSQL database separate and persistent.

### Deployment notes

- The backend currently allows cross-origin requests broadly. Before using it beyond a trusted demo, restrict its CORS origins to the deployed frontend domain.
- The app seeds and trains models on startup when the database has no patient records. The first startup can take longer than subsequent ones.
- Free hosting plans may pause idle services or limit resources; the first request after a pause can be slow.
- Keep database credentials in the hosting provider's environment settings. Never commit secrets or real health data.

## API and further documentation

The interactive API reference is available at `/docs` on a running backend. For additional feature, schema, endpoint, and machine-learning details, see [`healthbig/README.md`](healthbig/README.md).
