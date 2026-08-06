"""
FastAPI Application Entry Point
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import uvicorn

from .core.config import settings
from .core.database import init_database, close_all_connections, check_database_health
from .core.exceptions import LMSException, http_exception_from_lms
from .core.security import decode_token
from .api.v1.router import api_router
from .services.websocket_manager import ws_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting LMS Platform Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    
    # Initialize database
    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

    # Check database health
    health = check_database_health()
    if health.get("healthy"):
        logger.info("Database connection verified")
    else:
        logger.warning(f"Database health check failed: {health.get('error')}")

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down LMS Platform Backend...")
    close_all_connections()
    logger.info("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Learning Management System API",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Mount uploads for static file serving
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# WebSocket signaling for live session WebRTC
@app.websocket("/ws/live/{session_code}")
async def live_session_websocket(websocket: WebSocket, session_code: str, token: str = Query(...)):
    user_data = None
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        role = payload.get("role", "unknown")
        user_data = {"user_id": user_id, "role": role}

        await ws_manager.connect(session_code, websocket, user_id, role)

        async for message in websocket.iter_json():
            await ws_manager.handle_message(session_code, user_id, message)
    except WebSocketDisconnect:
        if user_data:
            await ws_manager.disconnect(session_code, user_data["user_id"])
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user_data:
            await ws_manager.disconnect(session_code, user_data["user_id"])


# WebSocket for real-time notifications
@app.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket, token: str = Query(...)):
    user_id = None
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        await ws_manager.connect_user(user_id, websocket)

        async for _ in websocket.iter_json():
            pass
    except WebSocketDisconnect:
        if user_id:
            await ws_manager.disconnect_user(user_id, websocket)
    except Exception as e:
        logger.error(f"Notification WebSocket error: {e}")
        if user_id:
            await ws_manager.disconnect_user(user_id, websocket)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Exception handlers
@app.exception_handler(LMSException)
async def lms_exception_handler(request: Request, exc: LMSException):
    """Handle custom LMS exceptions"""
    logger.error(f"LMS Exception: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", "Validation error"),
            "code": error.get("type", "INVALID")
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "errors": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "details": {"error": str(exc)} if settings.DEBUG else None
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    db_health = check_database_health()
    return {
        "status": "healthy" if db_health.get("healthy") else "unhealthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_health,
        "timestamp": datetime.now().isoformat()
    }


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD
    )