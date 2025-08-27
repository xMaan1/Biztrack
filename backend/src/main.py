from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

# Configure logging
logger = logging.getLogger(__name__)

from .config.database import create_tables
from .api.v1 import auth, users, projects, tasks, tenants, plans, sales, crm, hrm, custom_options, invoices, pos, inventory, subscriptions
from .core.security import security_middleware
from .core.tenant_middleware import tenant_middleware
from .core.audit import audit_logger
from .core.monitoring import system_monitor, perform_health_check
from .core.error_handling import error_handler
from .core.security import security_middleware as security_middleware_instance
from fastapi.exceptions import RequestValidationError

app = FastAPI(title="SparkCo ERP - Project Management & Sales API", version="1.0.0")

# Ensure tables are created at startup
@app.on_event("startup")
async def on_startup():
    create_tables()
    logging.info("🚀 SparkCo ERP API started successfully")
    logging.info("🔒 Security middleware enabled")
    logging.info("🏢 Tenant isolation middleware enabled")
    logging.info("📊 Monitoring system enabled")
    logging.info("📝 Audit logging enabled")

# Tenant middleware
@app.middleware("http")
async def tenant_middleware_func(request: Request, call_next):
    # Skip tenant validation for non-tenant endpoints
    if tenant_middleware._should_skip_tenant_validation(request):
        return await call_next(request)
    
    try:
        # Extract tenant ID from header
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Tenant-ID header is required"
            )
        
        # Validate tenant and subscription
        tenant_context = await tenant_middleware._validate_tenant_and_subscription(tenant_id, request)
        
        # Add tenant context to request state
        request.state.tenant_context = tenant_context
        
        # Check plan limits
        await tenant_middleware._check_plan_limits(tenant_context, request)
        
        # Process request
        response = await call_next(request)
        
        # Add tenant info to response headers
        response.headers["X-Tenant-ID"] = tenant_id
        response.headers["X-Tenant-Name"] = tenant_context["tenant_name"]
        response.headers["X-Plan-Type"] = tenant_context["plan_type"]
        
        return response
        
    except HTTPException as e:
        logger.warning(f"Tenant validation failed: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail, "error_code": "TENANT_VALIDATION_FAILED"}
        )
    except Exception as e:
        logger.error(f"Unexpected error in tenant middleware: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_code": "TENANT_MIDDLEWARE_ERROR"}
        )

# Security middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        # 1. Rate Limiting (check before processing)
        await security_middleware_instance._check_rate_limits(request)
        
        # 2. Input Validation (check before processing)
        await security_middleware_instance._validate_inputs(request)
        
        # 3. Process request and get response
        response = await call_next(request)
        
        # 4. Add security headers to response
        security_middleware_instance._add_security_headers(response)
        
        # 5. Logging
        await security_middleware_instance._log_request(request, response, start_time)
        
        return response
        
    except HTTPException as e:
        # Log security violations
        logger.warning(f"Security violation: {e.detail} from {request.client.host}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail, "error_code": "SECURITY_VIOLATION"}
        )
    except Exception as e:
        logger.error(f"Unexpected error in security middleware: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"}
        )

# Request/Response middleware for audit logging
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Extract user and tenant info for audit
        user_id = None
        tenant_id = None
        
        # Try to get user info from request state if available
        if hasattr(request.state, 'user'):
            user_id = str(request.state.user.id)
        
        # Get tenant ID from headers
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # Log the request for audit purposes
        try:
            audit_logger.log_http_request(
                request=request,
                response=response,
                user_id=user_id,
                tenant_id=tenant_id,
                processing_time=processing_time
            )
        except Exception as e:
            logger.error(f"Audit logging failed: {str(e)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Audit middleware error: {str(e)}")
        raise

# Include all routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(tenants.router)
app.include_router(plans.router)
# app.include_router(events.router)  # Temporarily disabled - Event models not implemented
app.include_router(sales.router)
app.include_router(crm.router)
app.include_router(hrm.router)
app.include_router(custom_options.router)
app.include_router(invoices.router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(subscriptions.router)

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

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return await error_handler.handle_generic_exception(request, exc)

@app.get("/")
def read_root():
    return {
        "message": "SparkCo ERP - Project Management & Sales API", 
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
    return {"status": "healthy", "service": "SparkCo ERP API", "timestamp": time.time()}

@app.get("/metrics")
async def get_metrics():
    """Get system metrics and performance data"""
    return await system_monitor.get_performance_summary()

@app.get("/metrics/history")
async def get_metrics_history(hours: int = 24):
    """Get metrics history for specified time period"""
    return await system_monitor.get_metrics_history(hours=hours)