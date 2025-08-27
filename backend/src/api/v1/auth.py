from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import timedelta

from ...models.unified_models import (
    LoginCredentials, AuthResponse, User, UserCreate, RefreshTokenRequest, 
    RefreshTokenResponse, TenantSelectionRequest, TenantSelectionResponse, TenantInfo
)
from ...config.database import get_db, get_user_by_email, get_user_by_username, create_user, get_user_tenants
from ...core.auth import (
    verify_password, get_password_hash, create_access_token, create_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ...api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    """Login user and return JWT token with available tenants"""
    user = get_user_by_email(credentials.email, db)
    if not user or not verify_password(credentials.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive"
        )
    
    # Get user's tenants
    user_tenants = get_user_tenants(str(user.id), db)
    
    # Create tenant info list
    available_tenants = []
    for tenant_user in user_tenants:
        if tenant_user.tenant and tenant_user.tenant.isActive:
            available_tenants.append(TenantInfo(
                id=str(tenant_user.tenant.id),
                name=tenant_user.tenant.name,
                domain=tenant_user.tenant.domain,
                role=tenant_user.role,
                isActive=tenant_user.tenant.isActive
            ))
    
    # Determine if tenant selection is required
    requires_tenant_selection = len(available_tenants) > 1
    
    # Create access token and refresh token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    refresh_token = create_refresh_token(
        data={"sub": user.email}
    )
    
    return AuthResponse(
        success=True,
        user=User(
            userId=str(user.id),
            userName=user.userName,
            email=user.email,
            firstName=user.firstName,
            lastName=user.lastName,
            userRole=user.userRole,
            avatar=user.avatar,
            permissions=[]
        ),
        token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        available_tenants=available_tenants,
        requires_tenant_selection=requires_tenant_selection
    )

@router.post("/select-tenant", response_model=TenantSelectionResponse)
async def select_tenant(
    tenant_request: TenantSelectionRequest, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Select a specific tenant and get tenant-specific access token"""
    # Verify user has access to this tenant
    user_tenants = get_user_tenants(str(current_user.id), db)
    selected_tenant = None
    user_role = None
    
    for tenant_user in user_tenants:
        if str(tenant_user.tenant.id) == tenant_request.tenant_id and tenant_user.tenant.isActive:
            selected_tenant = tenant_user.tenant
            user_role = tenant_user.role
            break
    
    if not selected_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant or tenant not found"
        )
    
    # Create tenant-specific access token
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "tenant_id": str(selected_tenant.id),
            "tenant_role": user_role
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TenantSelectionResponse(
        success=True,
        message=f"Successfully selected tenant: {selected_tenant.name}",
        tenant=TenantInfo(
            id=str(selected_tenant.id),
            name=selected_tenant.name,
            domain=selected_tenant.domain,
            role=user_role,
            isActive=selected_tenant.isActive
        ),
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/my-tenants")
async def get_my_tenants(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tenants that the current user has access to"""
    user_tenants = get_user_tenants(str(current_user.id), db)
    
    available_tenants = []
    for tenant_user in user_tenants:
        if tenant_user.tenant and tenant_user.tenant.isActive:
            available_tenants.append(TenantInfo(
                id=str(tenant_user.tenant.id),
                name=tenant_user.tenant.name,
                domain=tenant_user.tenant.domain,
                role=tenant_user.role,
                isActive=tenant_user.tenant.isActive
            ))
    
    return {
        "success": True,
        "tenants": available_tenants,
        "total": len(available_tenants)
    }

@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(refresh_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        from ...core.auth import verify_token
        
        # Verify refresh token
        payload = verify_token(refresh_request.refresh_token, "refresh")
        
        # Create new access token
        new_access_token = create_access_token(
            data={"sub": payload.get("sub")}
        )
        
        return RefreshTokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return User(
        userId=str(current_user.id),
        userName=current_user.userName,
        email=current_user.email,
        firstName=current_user.firstName,
        lastName=current_user.lastName,
        userRole=current_user.userRole,
        avatar=current_user.avatar,
        permissions=[]
    )

@router.post("/register", response_model=User)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    if get_user_by_email(user_data.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(user_data.userName, db):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashedPassword'] = hashed_password
    
    db_user = create_user(user_dict, db)
    
    return User(
        userId=str(db_user.id),
        userName=db_user.userName,
        email=db_user.email,
        firstName=db_user.firstName,
        lastName=db_user.lastName,
        userRole=db_user.userRole,
        avatar=db_user.avatar,
        permissions=[]
    )

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}