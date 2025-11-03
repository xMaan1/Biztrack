from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ...models.unified_models import User, UserCreate, UserUpdate, UsersResponse
from ...config.database import (
    get_db, get_user_by_email, get_user_by_username,
    get_user_by_id, create_user, get_all_users, update_user
)
from ...core.auth import get_password_hash
from ...presentation.dependencies.auth import get_current_user, get_tenant_context, require_super_admin, require_tenant_admin_or_super_admin
from ...presentation.dependencies.mediator import get_mediator
from ...core.mediator import Mediator
from ...core.result import Result
from ...application.commands import (
    CreateUserCommand, UpdateUserCommand, DeleteUserCommand
)
from ...application.queries import (
    GetUserByIdQuery, GetAllUsersQuery, GetUserByEmailQuery
)

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=UsersResponse, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def get_users(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get all users (tenant-scoped if tenant context provided)"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllUsersQuery(
        page=1,
        page_size=1000,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    users_data = result.value
    users = users_data.get("items", []) if isinstance(users_data, dict) else users_data if isinstance(users_data, list) else []
    
    user_list = []
    for user_entity in users:
        if hasattr(user_entity, 'id'):
            user_list.append(User(
                userId=str(user_entity.id),
                userName=user_entity.userName if hasattr(user_entity, 'userName') else "",
                email=user_entity.email if hasattr(user_entity, 'email') else "",
                firstName=user_entity.firstName if hasattr(user_entity, 'firstName') else None,
                lastName=user_entity.lastName if hasattr(user_entity, 'lastName') else None,
                userRole=user_entity.userRole if hasattr(user_entity, 'userRole') else "team_member",
                avatar=user_entity.avatar if hasattr(user_entity, 'avatar') else None,
                permissions=[]
            ))
        else:
            user_list.append(User(
                userId=str(user_entity.id) if hasattr(user_entity, 'id') else "",
                userName=getattr(user_entity, 'userName', ""),
                email=getattr(user_entity, 'email', ""),
                firstName=getattr(user_entity, 'firstName', None),
                lastName=getattr(user_entity, 'lastName', None),
                userRole=getattr(user_entity, 'userRole', "team_member"),
                avatar=getattr(user_entity, 'avatar', None),
                permissions=[]
            ))
    
    return UsersResponse(users=user_list)

@router.get("/{user_id}", response_model=User, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def get_user(
    user_id: str, 
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific user"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetUserByIdQuery(
        user_id=user_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    user_entity = result.value
    if not user_entity:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(
        userId=str(user_entity.id) if hasattr(user_entity, 'id') else user_id,
        userName=user_entity.userName if hasattr(user_entity, 'userName') else "",
        email=user_entity.email if hasattr(user_entity, 'email') else "",
        firstName=user_entity.firstName if hasattr(user_entity, 'firstName') else None,
        lastName=user_entity.lastName if hasattr(user_entity, 'lastName') else None,
        userRole=user_entity.userRole if hasattr(user_entity, 'userRole') else "team_member",
        avatar=user_entity.avatar if hasattr(user_entity, 'avatar') else None,
        permissions=[]
    )

@router.post("", response_model=User, dependencies=[Depends(require_super_admin)])
async def create_new_user(
    user_data: UserCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new user (admin only)"""
    if current_user.userRole != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users"
        )
    
    if get_user_by_email(user_data.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(user_data.userName, db):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = CreateUserCommand(
        userName=user_data.userName,
        email=user_data.email,
        password=user_data.password,
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        userRole=user_data.userRole.value if hasattr(user_data.userRole, 'value') else str(user_data.userRole),
        avatar=user_data.avatar,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    user_entity = result.value
    
    return User(
        userId=str(user_entity.id) if hasattr(user_entity, 'id') else "",
        userName=user_entity.userName if hasattr(user_entity, 'userName') else user_data.userName,
        email=user_entity.email if hasattr(user_entity, 'email') else user_data.email,
        firstName=user_entity.firstName if hasattr(user_entity, 'firstName') else user_data.firstName,
        lastName=user_entity.lastName if hasattr(user_entity, 'lastName') else user_data.lastName,
        userRole=user_entity.userRole if hasattr(user_entity, 'userRole') else str(user_data.userRole),
        avatar=user_entity.avatar if hasattr(user_entity, 'avatar') else user_data.avatar,
        permissions=[]
    )

@router.put("/{user_id}", response_model=User, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def update_user_info(
    user_id: str,
    user_data: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update user information"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Update user request - User ID: {user_id}, Current User ID: {current_user.id}")
    
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if str(current_user.id) != user_id:
        if tenant_context:
            from ...config.database import get_user_tenants
            user_tenants = get_user_tenants(str(user.id), db)
            user_tenant_ids = [str(tu.tenant_id) for tu in user_tenants]
            if tenant_context['tenant_id'] not in user_tenant_ids:
                raise HTTPException(status_code=403, detail="Not authorized to update this user")
        else:
            if current_user.tenant_id != user.tenant_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    if user_data.email and user_data.email != user.email:
        existing_user = get_user_by_email(user_data.email, db)
        if existing_user and str(existing_user.id) != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.userName and user_data.userName != user.userName:
        existing_user = get_user_by_username(user_data.userName, db)
        if existing_user and str(existing_user.id) != user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    update_dict = user_data.dict(exclude_unset=True)
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = UpdateUserCommand(
        user_id=user_id,
        tenant_id=tenant_id,
        userName=update_dict.get('userName'),
        email=update_dict.get('email'),
        firstName=update_dict.get('firstName'),
        lastName=update_dict.get('lastName'),
        userRole=update_dict['userRole'].value if 'userRole' in update_dict and hasattr(update_dict['userRole'], 'value') else update_dict.get('userRole'),
        avatar=update_dict.get('avatar')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    user_entity = result.value
    
    return User(
        userId=str(user_entity.id) if hasattr(user_entity, 'id') else user_id,
        userName=user_entity.userName if hasattr(user_entity, 'userName') else update_dict.get('userName', user.userName),
        email=user_entity.email if hasattr(user_entity, 'email') else update_dict.get('email', user.email),
        firstName=user_entity.firstName if hasattr(user_entity, 'firstName') else update_dict.get('firstName', user.firstName),
        lastName=user_entity.lastName if hasattr(user_entity, 'lastName') else update_dict.get('lastName', user.lastName),
        userRole=user_entity.userRole if hasattr(user_entity, 'userRole') else update_dict.get('userRole', user.userRole),
        avatar=user_entity.avatar if hasattr(user_entity, 'avatar') else update_dict.get('avatar', user.avatar),
        permissions=[]
    )

@router.delete("/{user_id}", dependencies=[Depends(require_super_admin)])
async def delete_user(
    user_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a user (admin only)"""
    if current_user.userRole != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if tenant_context and str(user.tenant_id) != tenant_context["tenant_id"]:
        raise HTTPException(status_code=403, detail="Access denied to this user")
    
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteUserCommand(
        user_id=user_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "User deleted successfully"}
