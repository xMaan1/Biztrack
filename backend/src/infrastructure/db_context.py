from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
from .connection_settings import ConnectionSettings

engine = create_engine(
    ConnectionSettings.DATABASE_URL,
    pool_size=ConnectionSettings.POOL_SIZE,
    max_overflow=ConnectionSettings.MAX_OVERFLOW,
    pool_pre_ping=ConnectionSettings.POOL_PRE_PING,
    pool_recycle=ConnectionSettings.POOL_RECYCLE,
    echo=ConnectionSettings.ECHO
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator:
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

