"""
Database Connection Management
Handles MySQL connection pooling and session management
"""

import logging
from typing import Optional, Generator, Dict, Any
from contextlib import contextmanager
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError, OperationalError

from .config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create SQLAlchemy Base
Base = declarative_base()

# Global engine and session factory
_engine = None
_SessionLocal = None


def get_engine():
    """
    Get or create database engine with connection pooling
    """
    global _engine
    
    if _engine is None:
        try:
            logger.info(f"Creating database engine for {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
            
            # Create engine with connection pool
            _engine = create_engine(
                settings.DATABASE_URL,
                poolclass=QueuePool,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_pre_ping=True,  # Verify connections before using
                pool_recycle=3600,   # Recycle connections after 1 hour
                echo=settings.DEBUG,  # Log SQL queries in debug mode
                echo_pool=settings.DEBUG,
                connect_args={
                    "charset": "utf8mb4",
                    "use_unicode": True,
                }
            )
            
            # Test connection
            with _engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection successful")
                
        except Exception as e:
            logger.error(f"Failed to create database engine: {str(e)}")
            raise RuntimeError(f"Database connection failed: {str(e)}")
    
    return _engine


def get_session_factory():
    """
    Get or create session factory
    """
    global _SessionLocal
    
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            expire_on_commit=False,
        )
    
    return _SessionLocal


def get_db_session() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session
    Yields a session and ensures it's closed after use
    Services control their own commit/rollback behavior.
    """
    session_factory = get_session_factory()
    session = session_factory()
    
    try:
        yield session
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        session.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database sessions
    Use this for non-FastAPI contexts
    """
    session_factory = get_session_factory()
    session = session_factory()
    
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database context error: {str(e)}")
        raise
    finally:
        session.close()


def init_database():
    """
    Initialize database - create tables if they don't exist
    """
    try:
        engine = get_engine()
        logger.info("Creating database tables (if not exists)...")
        
        # Import all models to ensure they're registered with Base
        from app.models import user, role, profile, course, enrollment, lecture, material
        from app.models import attendance, assignment, submission, grade, department
        from app.models import audit_log, notification, face_encoding, quiz, review
        from app.models import student, teacher, admin
        from app.models import course_deletion_request
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise


def check_database_health() -> Dict[str, Any]:
    """
    Check database health and connection
    Returns health status dictionary
    """
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as healthy, NOW() as server_time, VERSION() as version"))
            row = result.fetchone()
            
            return {
                "healthy": True,
                "server_time": str(row.server_time),
                "mysql_version": str(row.version),
                "database": settings.DB_NAME,
                "host": settings.DB_HOST,
            }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "healthy": False,
            "error": str(e),
            "database": settings.DB_NAME,
            "host": settings.DB_HOST,
        }


def close_all_connections():
    """
    Close all database connections
    Called on application shutdown
    """
    global _engine, _SessionLocal
    
    try:
        if _engine:
            logger.info("Closing database connections...")
            _engine.dispose()
            _engine = None
            _SessionLocal = None
            logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")


# Export commonly used functions
__all__ = [
    "Base",
    "get_engine",
    "get_session_factory",
    "get_db_session",
    "get_db_context",
    "init_database",
    "check_database_health",
    "close_all_connections",
]