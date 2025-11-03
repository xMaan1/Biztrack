import asyncio
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta
import json

from ...config.database import (
    get_db, get_tenant_by_id, get_subscription_by_tenant,
    get_tenant_users, get_user_by_email
)
from ..dependencies.auth import get_current_user

logger = logging.getLogger(__name__)

class TenantMiddleware:
    def __init__(self):
        self.tenant_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 300
        
    async def __call__(self, request: Request, call_next):
        if self._should_skip_tenant_validation(request):
            return await call_next(request)
        
        try:
            tenant_id = await self._extract_tenant_id(request)
            tenant_context = await self._validate_tenant_and_subscription(tenant_id, request)
            request.state.tenant_context = tenant_context
            await self._check_plan_limits(tenant_context, request)
            response = await call_next(request)
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
    
    def _should_skip_tenant_validation(self, request: Request) -> bool:
        skip_paths = [
            "/auth/login", "/auth/register", "/auth/refresh", "/auth/select-tenant",
            "/auth/my-tenants", "/health", "/health/simple", "/metrics", "/docs",
            "/openapi.json", "/tenants/subscribe", "/tenants/plans", "/tenants/create-tenant",
            "/public", "/"
        ]
        return any(request.url.path.startswith(path) for path in skip_paths)
    
    async def _validate_tenant_and_subscription(self, tenant_id: str, request: Request) -> Dict[str, Any]:
        cache_key = f"tenant_{tenant_id}"
        if cache_key in self.tenant_cache:
            cached_data = self.tenant_cache[cache_key]
            if datetime.utcnow().timestamp() - cached_data["cached_at"] < self.cache_ttl:
                return cached_data["data"]
        
        db = next(get_db())
        
        try:
            tenant = get_tenant_by_id(tenant_id, db)
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found"
                )
            
            if not tenant.isActive:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant is inactive"
                )
            
            subscription = get_subscription_by_tenant(tenant_id, db)
            if not subscription:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No active subscription found"
                )
            
            if subscription.status not in ["active", "trial"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Subscription is {subscription.status}"
                )
            
            if subscription.endDate and subscription.endDate < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Subscription has expired"
                )
            
            plan = subscription.plan
            if not plan:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Plan information not found"
                )
            
            tenant_context = {
                "tenant_id": tenant_id,
                "tenant_name": tenant.name,
                "tenant_domain": tenant.domain,
                "subscription_id": str(subscription.id),
                "plan_id": str(plan.id),
                "plan_type": plan.planType,
                "plan_name": plan.name,
                "max_projects": plan.maxProjects,
                "max_users": plan.maxUsers,
                "features": plan.features or [],
                "subscription_status": subscription.status,
                "trial_ends": subscription.endDate if subscription.status == "trial" else None,
                "auto_renew": subscription.autoRenew
            }
            
            self.tenant_cache[cache_key] = {
                "data": tenant_context,
                "cached_at": datetime.utcnow().timestamp()
            }
            
            return tenant_context
            
        finally:
            db.close()
    
    async def _extract_tenant_id(self, request: Request) -> str:
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        try:
            from ...core.auth import verify_token
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token, "access")
                tenant_id = payload.get("tenant_id")
                if tenant_id:
                    return tenant_id
        except Exception:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID header or tenant-specific JWT token is required"
        )
    
    async def _check_plan_limits(self, tenant_context: Dict[str, Any], request: Request):
        if self._should_skip_limit_checking(request):
            return
        
        db = next(get_db())
        
        try:
            if tenant_context.get("max_users"):
                current_users = len(get_tenant_users(tenant_context["tenant_id"], db))
                if current_users >= tenant_context["max_users"]:
                    if request.method in ["POST", "PUT", "PATCH"] and "/users" in request.url.path:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"User limit reached ({current_users}/{tenant_context['max_users']}). Please upgrade your plan."
                        )
            
            if tenant_context.get("max_projects"):
                from ...config.database import get_all_projects
                current_projects = len(get_all_projects(db, tenant_id=tenant_context["tenant_id"]))
                if current_projects >= tenant_context["max_projects"]:
                    if request.method in ["POST", "PUT", "PATCH"] and "/projects" in request.url.path:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Project limit reached ({current_projects}/{tenant_context['max_projects']}). Please upgrade your plan."
                        )
            
            if request.url.path.startswith("/crm") and "crm" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CRM feature not available in your current plan"
                )
            
            if request.url.path.startswith("/hrm") and "hrm" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="HRM feature not available in your current plan"
                )
            
            if request.url.path.startswith("/inventory") and "inventory" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Inventory feature not available in your current plan"
                )
                
        finally:
            db.close()
    
    def _should_skip_limit_checking(self, request: Request) -> bool:
        skip_paths = ["/auth", "/health", "/docs", "/openapi.json", "/public"]
        return any(request.url.path.startswith(path) for path in skip_paths)

tenant_middleware = TenantMiddleware()

async def get_tenant_context_from_request(request: Request) -> Dict[str, Any]:
    if not hasattr(request.state, 'tenant_context'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context not available"
        )
    return request.state.tenant_context

