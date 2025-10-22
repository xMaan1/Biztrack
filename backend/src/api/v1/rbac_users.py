from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID

from ...models.unified_models import (
    User, UserCreate, UserUpdate, UsersResponse,
    TenantUser, TenantUserCreate, TenantUserUpdate, TenantUsersResponse,
    Role, RoleCreate, RoleUpdate, RolesResponse,
    UserWithPermissions, ModulePermission, TenantRole
)
from ...config.database import (
    get_db, get_user_by_email, get_user_by_username,
    get_user_by_id, create_user, get_all_users
)
from ...config.core_models import User as UserModel, TenantUser as TenantUserModel, Role as RoleModel
from ...core.auth import get_password_hash
from ...api.dependencies import (
    get_current_user, get_tenant_context, 
    require_owner_or_permission, require_permission
)
from ...services.rbac_service import RBACService

router = APIRouter(prefix="/rbac", tags=["rbac"])

# Role Management Endpoints
@router.get("/roles", response_model=RolesResponse)
async def get_roles(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_VIEW.value))
):
    """Get all roles for the tenant"""
    roles = db.query(RoleModel).filter(
        and_(
            RoleModel.tenant_id == tenant_context["tenant_id"],
            RoleModel.isActive == True
        )
    ).all()
    
    role_list = []
    for role in roles:
        role_list.append(Role(
            id=str(role.id),
            tenant_id=str(role.tenant_id),
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            permissions=role.permissions,
            isActive=role.isActive,
            createdAt=role.createdAt,
            updatedAt=role.updatedAt
        ))
    
    return RolesResponse(roles=role_list, pagination={})

@router.post("/roles", response_model=Role)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_CREATE.value))
):
    """Create a new role"""
    role = RoleModel(
        tenant_id=tenant_context["tenant_id"],
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        permissions=role_data.permissions,
        isActive=role_data.isActive
    )
    
    db.add(role)
    db.commit()
    db.refresh(role)
    
    return Role(
        id=str(role.id),
        tenant_id=str(role.tenant_id),
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        permissions=role.permissions,
        isActive=role.isActive,
        createdAt=role.createdAt,
        updatedAt=role.updatedAt
    )

@router.put("/roles/{role_id}", response_model=Role)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_UPDATE.value))
):
    """Update a role"""
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.id == role_id,
            RoleModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    update_dict = role_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(role, key) and value is not None:
            setattr(role, key, value)
    
    db.commit()
    db.refresh(role)
    
    return Role(
        id=str(role.id),
        tenant_id=str(role.tenant_id),
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        permissions=role.permissions,
        isActive=role.isActive,
        createdAt=role.createdAt,
        updatedAt=role.updatedAt
    )

# Tenant User Management Endpoints
@router.get("/tenant-users", response_model=List[UserWithPermissions])
async def get_tenant_users(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_VIEW.value))
):
    """Get all tenant users with their roles and permissions"""
    tenant_users = db.query(TenantUserModel).join(UserModel).join(RoleModel).filter(
        and_(
            TenantUserModel.tenant_id == tenant_context["tenant_id"],
            TenantUserModel.isActive == True
        )
    ).all()
    
    user_list = []
    for tenant_user in tenant_users:
        user_permissions = RBACService.get_user_permissions(
            db, str(tenant_user.userId), tenant_context["tenant_id"]
        )
        
        user_list.append(UserWithPermissions(
            id=str(tenant_user.userId),
            userName=tenant_user.user.userName,
            email=tenant_user.user.email,
            firstName=tenant_user.user.firstName,
            lastName=tenant_user.user.lastName,
            avatar=tenant_user.user.avatar,
            isActive=tenant_user.isActive,
            role=Role(
                id=str(tenant_user.role_obj.id),
                tenant_id=str(tenant_user.role_obj.tenant_id),
                name=tenant_user.role_obj.name,
                display_name=tenant_user.role_obj.display_name,
                description=tenant_user.role_obj.description,
                permissions=tenant_user.role_obj.permissions,
                isActive=tenant_user.role_obj.isActive,
                createdAt=tenant_user.role_obj.createdAt,
                updatedAt=tenant_user.role_obj.updatedAt
            ) if tenant_user.role_obj else None,
            permissions=user_permissions,
            joinedAt=tenant_user.joinedAt
        ))
    
    return user_list

@router.post("/tenant-users", response_model=TenantUser)
async def create_tenant_user(
    user_data: TenantUserCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_CREATE.value))
):
    """Create a new tenant user"""
    # Check if user exists
    user = get_user_by_id(user_data.userId, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already in this tenant
    existing_tenant_user = db.query(TenantUserModel).filter(
        and_(
            TenantUserModel.userId == user_data.userId,
            TenantUserModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if existing_tenant_user:
        if existing_tenant_user.isActive:
            raise HTTPException(status_code=400, detail="User already exists in this tenant")
        else:
            # Reactivate user
            existing_tenant_user.isActive = True
            existing_tenant_user.role_id = user_data.role_id
            existing_tenant_user.custom_permissions = user_data.custom_permissions
            db.commit()
            db.refresh(existing_tenant_user)
            return TenantUser(
                id=str(existing_tenant_user.id),
                tenant_id=str(existing_tenant_user.tenant_id),
                userId=str(existing_tenant_user.userId),
                role_id=str(existing_tenant_user.role_id),
                custom_permissions=existing_tenant_user.custom_permissions,
                isActive=existing_tenant_user.isActive,
                invitedBy=str(existing_tenant_user.invitedBy) if existing_tenant_user.invitedBy else None,
                joinedAt=existing_tenant_user.joinedAt,
                createdAt=existing_tenant_user.createdAt,
                updatedAt=existing_tenant_user.updatedAt
            )
    
    # Verify role exists
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.id == user_data.role_id,
            RoleModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Create tenant user
    tenant_user = TenantUserModel(
        tenant_id=tenant_context["tenant_id"],
        userId=user_data.userId,
        role_id=user_data.role_id,
        role=role.name,  # Populate the role name field
        custom_permissions=user_data.custom_permissions,
        isActive=user_data.isActive,
        invitedBy=str(current_user.id)
    )
    
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)
    
    return TenantUser(
        id=str(tenant_user.id),
        tenant_id=str(tenant_user.tenant_id),
        userId=str(tenant_user.userId),
        role_id=str(tenant_user.role_id),
        custom_permissions=tenant_user.custom_permissions,
        isActive=tenant_user.isActive,
        invitedBy=str(tenant_user.invitedBy) if tenant_user.invitedBy else None,
        joinedAt=tenant_user.joinedAt,
        createdAt=tenant_user.createdAt,
        updatedAt=tenant_user.updatedAt
    )

@router.put("/tenant-users/{tenant_user_id}", response_model=TenantUser)
async def update_tenant_user(
    tenant_user_id: str,
    user_data: TenantUserUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_UPDATE.value))
):
    """Update a tenant user"""
    tenant_user = db.query(TenantUserModel).filter(
        and_(
            TenantUserModel.id == tenant_user_id,
            TenantUserModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not tenant_user:
        raise HTTPException(status_code=404, detail="Tenant user not found")
    
    # Verify role exists if updating role
    if user_data.role_id:
        role = db.query(RoleModel).filter(
            and_(
                RoleModel.id == user_data.role_id,
                RoleModel.tenant_id == tenant_context["tenant_id"]
            )
        ).first()
        
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
    
    update_dict = user_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(tenant_user, key) and value is not None:
            setattr(tenant_user, key, value)
    
    db.commit()
    db.refresh(tenant_user)
    
    return TenantUser(
        id=str(tenant_user.id),
        tenant_id=str(tenant_user.tenant_id),
        userId=str(tenant_user.userId),
        role_id=str(tenant_user.role_id),
        custom_permissions=tenant_user.custom_permissions,
        isActive=tenant_user.isActive,
        invitedBy=str(tenant_user.invitedBy) if tenant_user.invitedBy else None,
        joinedAt=tenant_user.joinedAt,
        createdAt=tenant_user.createdAt,
        updatedAt=tenant_user.updatedAt
    )

@router.delete("/tenant-users/{tenant_user_id}")
async def remove_tenant_user(
    tenant_user_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_DELETE.value))
):
    """Remove a user from tenant"""
    tenant_user = db.query(TenantUserModel).filter(
        and_(
            TenantUserModel.id == tenant_user_id,
            TenantUserModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not tenant_user:
        raise HTTPException(status_code=404, detail="Tenant user not found")
    
    # Don't allow removing self
    if str(tenant_user.userId) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the tenant"
        )
    
    # Soft delete
    tenant_user.isActive = False
    db.commit()
    
    return {"message": "User removed from tenant successfully"}

@router.delete("/remove-user/{user_id}")
async def remove_user_from_tenant(
    user_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_DELETE.value))
):
    """Remove a user from tenant by user ID"""
    tenant_user = db.query(TenantUserModel).filter(
        and_(
            TenantUserModel.userId == user_id,
            TenantUserModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not tenant_user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    # Don't allow removing self
    if str(tenant_user.userId) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot remove yourself from tenant")
    
    # Soft delete - set isActive to False
    tenant_user.isActive = False
    db.commit()
    
    return {"message": "User removed from tenant successfully"}

# User Creation Endpoint (for tenant owners)
@router.post("/create-user", response_model=User)
async def create_user_for_tenant(
    user_data: UserCreate,
    role_id: str = Query(..., description="Role ID to assign to the user"),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(require_permission(ModulePermission.USERS_CREATE.value))
):
    """Create a new user and add them to the tenant"""
    # Check if email is unique within tenant
    if not RBACService.validate_email_uniqueness(db, user_data.email, tenant_context["tenant_id"]):
        raise HTTPException(status_code=400, detail="Email already exists in this tenant")
    
    # Check if username is unique
    if get_user_by_username(user_data.userName, db):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Verify role exists
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.id == role_id,
            RoleModel.tenant_id == tenant_context["tenant_id"]
        )
    ).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashedPassword'] = hashed_password
    user_dict['tenant_id'] = UUID(tenant_context["tenant_id"])
    
    db_user = create_user(user_dict, db)
    
    # Add user to tenant
    tenant_user = TenantUserModel(
        tenant_id=UUID(tenant_context["tenant_id"]),
        userId=UUID(str(db_user.id)),
        role_id=UUID(role_id),
        role=role.name,  # Populate the role name field
        custom_permissions=[],
        isActive=True,
        invitedBy=UUID(str(current_user.id))
    )
    
    db.add(tenant_user)
    db.commit()
    
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

# Permission checking endpoints
@router.get("/permissions")
async def get_user_permissions(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(get_current_user)
):
    """Get current user's permissions"""
    permissions = RBACService.get_user_permissions(db, str(current_user.id), tenant_context["tenant_id"])
    accessible_modules = RBACService.get_accessible_modules(db, str(current_user.id), tenant_context["tenant_id"])
    is_owner = RBACService.is_owner(db, str(current_user.id), tenant_context["tenant_id"])

    return {
        "permissions": permissions,
        "accessible_modules": accessible_modules,
        "is_owner": is_owner
    }

@router.get("/check-permission/{permission}")
async def check_permission(
    permission: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user = Depends(get_current_user)
):
    """Check if current user has specific permission"""
    has_permission = RBACService.has_permission(db, str(current_user.id), tenant_context["tenant_id"], permission)
    
    return {
        "permission": permission,
        "has_permission": has_permission
    }
