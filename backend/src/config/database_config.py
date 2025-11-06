import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import DisconnectionError, OperationalError
from dotenv import load_dotenv
import logging

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

logger = logging.getLogger(__name__)

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_reset_on_return='commit',
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    },
    echo=False
)

@event.listens_for(engine, "connect")
def set_connection_timeouts(dbapi_conn, connection_record):
    try:
        with dbapi_conn.cursor() as cursor:
            cursor.execute("SET statement_timeout = 30000")
            cursor.execute("SET idle_in_transaction_session_timeout = 60000")
    except Exception as e:
        logger.warning(f"Failed to set connection timeouts: {e}")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    try:
        cursor = dbapi_conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
    except Exception:
        raise DisconnectionError("Connection lost during checkout")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    except OperationalError as e:
        logger.error(f"Database operational error: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        try:
            db.close()
        except Exception as e:
            logger.warning(f"Error closing database connection: {e}")
