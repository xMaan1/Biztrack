
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..core.auth import verify_token
from ..config.database import get_db, get_user_by_email, get_user_tenants, get_tenant_by_id
from ..services.rbac_service import RBACService
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.unified_models import ModulePermission
import logging

logger = logging.getLogger(__name__)

class CustomHTTPBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning(
                f"Authentication failed: Missing Authorization header | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {request.headers.get('X-Tenant-ID', 'missing')}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication required: Missing Authorization header. Please provide a valid Bearer token."
            )
        
        if not auth_header.startswith("Bearer "):
            logger.warning(
                f"Authentication failed: Invalid Authorization header format | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Header format: {auth_header[:20]}..."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication required: Invalid Authorization header format. Expected 'Bearer <token>'."
            )
        
        return await super().__call__(request)

security = CustomHTTPBearer()

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        tenant_id = request.headers.get("X-Tenant-ID", "missing")
        
        logger.debug(
            f"Authenticating user | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"Tenant-ID: {tenant_id} | "
            f"Token length: {len(token)}"
        )
        
        payload = verify_token(token, "access")
        email = payload.get("sub")
        
        if email is None:
            logger.warning(
                f"Authentication failed: Token missing email (sub claim) | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {tenant_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Missing user identifier in token"
            )
        
        user = get_user_by_email(email, db)
        if not user:
            logger.warning(
                f"Authentication failed: User not found in database | "
                f"Email: {email} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {tenant_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User not found: No user exists with email {email}"
            )
        
        logger.debug(
            f"User authenticated successfully | "
            f"User ID: {user.id} | "
            f"Email: {email} | "
            f"URL: {request.url.path} | "
            f"Tenant-ID: {tenant_id}"
        )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Authentication error: Unexpected exception | "
            f"Error: {str(e)} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'} | "
            f"Tenant-ID: {request.headers.get('X-Tenant-ID', 'missing')}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed due to internal error"
        )

def get_tenant_context(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tenant context from header and verify user access"""
    if not x_tenant_id:
        logger.warning(
            f"Tenant context missing: X-Tenant-ID header not provided | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"User ID: {current_user.id} | "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
        return None

    logger.debug(
        f"Validating tenant context | "
        f"Tenant ID: {x_tenant_id} | "
        f"User ID: {current_user.id} | "
        f"URL: {request.url.path}"
    )

    tenant = get_tenant_by_id(x_tenant_id, db)
    if not tenant:
        logger.warning(
            f"Tenant not found | "
            f"Tenant ID: {x_tenant_id} | "
            f"User ID: {current_user.id} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant not found: No tenant exists with ID {x_tenant_id}"
        )

    user_tenants = get_user_tenants(str(current_user.id), db)
    user_tenant = next((tu for tu in user_tenants if str(tu.tenant_id) == x_tenant_id), None)

    if not user_tenant:
        logger.warning(
            f"Access denied: User not associated with tenant | "
            f"User ID: {current_user.id} | "
            f"Email: {current_user.email} | "
            f"Tenant ID: {x_tenant_id} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'} | "
            f"User's tenants: {[str(t.tenant_id) for t in user_tenants]}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: User {current_user.email} is not associated with tenant {x_tenant_id}"
        )

    user_permissions = RBACService.get_user_permissions(db, str(current_user.id), x_tenant_id)
    user_role = RBACService.get_user_role(db, str(current_user.id), x_tenant_id)
    
    logger.debug(
        f"Tenant context validated | "
        f"Tenant ID: {x_tenant_id} | "
        f"User ID: {current_user.id} | "
        f"Role: {user_role} | "
        f"Permissions count: {len(user_permissions)}"
    )
    
    return {
        "tenant": tenant,
        "user_role": user_role,
        "permissions": user_permissions,
        "tenant_id": x_tenant_id,
        "is_owner": RBACService.is_owner(db, str(current_user.id), x_tenant_id)
    }

def require_permission(permission: str):
    """Dependency to require specific permission"""
    def permission_checker(
        request: Request,
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if not tenant_context:
            logger.warning(
                f"Permission check failed: Tenant context missing | "
                f"Required permission: {permission} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"User ID: {current_user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required: X-Tenant-ID header must be provided"
            )
        
        if tenant_context.get("is_owner"):
            logger.debug(
                f"Permission granted: User is owner | "
                f"Required permission: {permission} | "
                f"User ID: {current_user.id} | "
                f"Tenant ID: {tenant_context.get('tenant_id')}"
            )
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        if permission not in user_permissions:
            logger.warning(
                f"Permission denied: User lacks required permission | "
                f"Required permission: {permission} | "
                f"User ID: {current_user.id} | "
                f"Email: {current_user.email} | "
                f"Tenant ID: {tenant_context.get('tenant_id')} | "
                f"User role: {tenant_context.get('user_role')} | "
                f"User permissions: {user_permissions} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: '{permission}' permission required. Current role: {tenant_context.get('user_role')}"
            )
        
        logger.debug(
            f"Permission granted | "
            f"Permission: {permission} | "
            f"User ID: {current_user.id} | "
            f"Tenant ID: {tenant_context.get('tenant_id')}"
        )
        
        return current_user
    
    return permission_checker

def require_module_access(module: str):
    """Dependency to require access to a module"""
    def module_checker(
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        if tenant_context.get("is_owner"):
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        module_permissions = [p for p in user_permissions if p.startswith(f"{module}:")]
        if len(module_permissions) == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access to '{module}' module required"
            )
        
        return current_user
    
    return module_checker

def require_owner_or_permission(permission: str):
    """Dependency to require owner role or specific permission"""
    def checker(
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        if tenant_context.get("is_owner"):
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner role or specific permission required"
            )
        
        return current_user
    
    return checker

def require_super_admin(current_user = Depends(get_current_user)):
    if getattr(current_user, 'userRole', None) != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Super admin privileges required.'
        )
    return current_user

def require_tenant_admin_or_super_admin(
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    if getattr(current_user, 'userRole', None) == 'super_admin':
        return current_user
    
    if tenant_context and tenant_context.get('is_owner'):
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail='Owner role required.'
    )