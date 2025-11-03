from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import logging

# Configure logging
logger = logging.getLogger(__name__)

from .config.database import create_tables
from .presentation.internal_routers import (
    auth, users, projects, tasks, tenants, plans, sales, crm, hrm, custom_options,
    invoices, invoice_customization, pos, inventory, subscriptions, work_orders,
    production, quality_control, maintenance, ledger, admin, file_upload,
    deduct_stock, customer_import, dashboard, investments, reports, notifications,
    banking, rbac_users, events
)
from .presentation.middleware import (
    security_middleware,
    tenant_middleware,
    audit_middleware
)
from .core.audit import audit_logger
from .core.monitoring import system_monitor, perform_health_check
from .presentation.exception_handlers import error_handler
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session

app = FastAPI(title="BizTrack - Project Management & Sales API", version="1.0.0")

# Ensure tables are created at startup
@app.on_event("startup")
async def on_startup():
    create_tables()
    logging.info("🚀 BizTrack API started successfully")
    logging.info("🔒 Security middleware enabled")
    logging.info("🏢 Tenant isolation middleware enabled")
    logging.info("📊 Monitoring system enabled")
    logging.info("📝 Audit logging enabled")

app.middleware("http")(tenant_middleware)
app.middleware("http")(security_middleware)
app.middleware("http")(audit_middleware)

# Include all routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rbac_users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(tenants.router)
app.include_router(plans.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(sales.router)
app.include_router(crm.router)
app.include_router(customer_import.router)
app.include_router(hrm.router)
app.include_router(custom_options.router)
app.include_router(invoices.router)
app.include_router(invoice_customization.router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(deduct_stock.router)
app.include_router(subscriptions.router)
app.include_router(work_orders.router)
app.include_router(production.router)
app.include_router(quality_control.router)
app.include_router(maintenance.router)
app.include_router(ledger.router)
app.include_router(banking.router)
app.include_router(investments.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(file_upload.router)
app.include_router(notifications.router)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return await error_handler.handle_validation_error(request, exc)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return await error_handler.handle_http_exception(request, exc)

# Mount static files for uploaded content
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return await error_handler.handle_generic_exception(request, exc)

@app.get("/")
def read_root():
    return {
        "message": "BizTrack - Project Management & Sales API", 
        "status": "running",
        "landing_page": "/landing",
        "api_docs": "/docs",
        "health_check": "/health"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with comprehensive system status"""
    return await perform_health_check()

@app.get("/health/simple")
async def simple_health_check():
    """Simple health check for load balancers"""
    return {"status": "healthy", "service": "BizTrack API", "timestamp": time.time()}

@app.get("/metrics")
async def get_metrics():
    """Get system metrics and performance data"""
    return await system_monitor.get_performance_summary()

@app.get("/metrics/history")
async def get_metrics_history(hours: int = 24):
    """Get metrics history for specified time period"""
    return await system_monitor.get_metrics_history(hours=hours)
