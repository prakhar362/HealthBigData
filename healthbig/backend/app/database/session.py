import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("healthbig.database")

# Environment-configurable database URL
# Supports PostgreSQL by default (with user customizable PG credentials)
# Seamlessly falls back to local SQLite if PostgreSQL is unreachable or unconfigured
DEFAULT_PG_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/healthbig_db"
)
SQLITE_URL = "sqlite:///./healthbig.db"

Base = declarative_base()

def get_engine():
    pg_url = os.getenv("DATABASE_URL", DEFAULT_PG_URL)
    # Check if we should use SQLite directly
    if os.getenv("USE_SQLITE", "").lower() in ("true", "1", "yes"):
        logger.info(f"Using SQLite database engine at {SQLITE_URL}")
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False, "timeout": 30})
    
    try:
        engine = create_engine(pg_url, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
        return engine
    except Exception as e:
        logger.warning(
            f"Could not connect to PostgreSQL ({e}). "
            f"Falling back gracefully to local SQLite database: {SQLITE_URL}"
        )
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False, "timeout": 30})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
