import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import Base, engine, SessionLocal
from app.ml.trainer import seed_database_and_train_ml
from app.streaming.simulator import simulator
from app.api import (
    dashboard,
    patients,
    analytics,
    prediction,
    monitoring,
    datasets,
    reports
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("healthbig")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize database tables
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed database cohort and train ML classifiers if empty
    db = SessionLocal()
    try:
        logger.info("Checking database seed cohort...")
        seed_database_and_train_ml(db)
    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {e}")
    finally:
        db.close()

    # 3. Start real-time patient simulator
    logger.info("Starting background real-time vital telemetry simulator...")
    simulator.start()

    yield

    # Teardown
    logger.info("Stopping real-time vital simulator...")
    simulator.stop()

app = FastAPI(
    title="HealthBig – Healthcare Big Data Analytics & Patient Risk Prediction System",
    description="Academic Big Data Analytics and Patient Risk Prediction System API",
    version="1.0.0",
    lifespan=lifespan
)

# Allow the local and deployed frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://health-big-data.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(dashboard.router)
app.include_router(patients.router)
app.include_router(analytics.router)
app.include_router(prediction.router)
app.include_router(monitoring.router)
app.include_router(datasets.router)
app.include_router(reports.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "application": "HealthBig",
        "description": "Healthcare Big Data Analytics and Patient Risk Prediction System",
        "status": "online",
        "docs_url": "/docs",
        "database_engine": str(engine.url).split("://")[0]
    }

