
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..core.auth import verify_token
from ..config.database import get_db, get_user_by_email, get_user_tenants, get_tenant_by_id
from ..services.rbac_service import RBACService
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.unified_models import ModulePermission

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token, "access")
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    user = get_user_by_email(email, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tenant context from header and verify user access"""
    if not x_tenant_id:
        return None

    tenant = get_tenant_by_id(x_tenant_id, db)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    user_tenants = get_user_tenants(str(current_user.id), db)
    user_tenant = next((tu for tu in user_tenants if str(tu.tenant_id) == x_tenant_id), None)

    if not user_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant"
        )

    user_permissions = RBACService.get_user_permissions(db, str(current_user.id), x_tenant_id)
    user_role = RBACService.get_user_role(db, str(current_user.id), x_tenant_id)
    
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
                detail=f"Permission '{permission}' required"
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