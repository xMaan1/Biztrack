from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr

from ...models.unified_models import User, UserUpdate
from ...config.database import get_db, get_user_by_id, update_user, get_user_by_email, get_user_by_username
from ...core.auth import verify_password, get_password_hash
from ...api.dependencies import get_current_user, get_tenant_context
from ...services.rbac_service import RBACService

router = APIRouter(prefix="/profile", tags=["profile"])

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None

@router.get("/me", response_model=User)
async def get_my_profile(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

@router.put("/me", response_model=User)
async def update_my_profile(
    profile_data: ProfileUpdateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    user = get_user_by_id(str(current_user.id), db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = profile_data.dict(exclude_unset=True)
    
    if "email" in update_dict and update_dict["email"] != user.email:
        existing_user = get_user_by_email(update_dict["email"], db)
        if existing_user and str(existing_user.id) != str(current_user.id):
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if "userName" in update_dict and update_dict["userName"] != user.userName:
        if tenant_context:
            if not RBACService.validate_username_uniqueness(
                db, 
                update_dict["userName"], 
                tenant_context["tenant_id"], 
                exclude_user_id=str(current_user.id)
            ):
                raise HTTPException(status_code=400, detail="Username already taken in this tenant")
        else:
            existing_user = get_user_by_username(update_dict["userName"], db)
            if existing_user and str(existing_user.id) != str(current_user.id):
                raise HTTPException(status_code=400, detail="Username already taken")
    
    updated_user = update_user(str(current_user.id), update_dict, db)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or could not be updated")
    
    return User(
        userId=str(updated_user.id),
        userName=updated_user.userName,
        email=updated_user.email,
        firstName=updated_user.firstName,
        lastName=updated_user.lastName,
        userRole=updated_user.userRole,
        avatar=updated_user.avatar,
        permissions=[]
    )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(str(current_user.id), db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(password_data.current_password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    hashed_password = get_password_hash(password_data.new_password)
    update_dict = {"hashedPassword": hashed_password}
    
    updated_user = update_user(str(current_user.id), update_dict, db)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="Failed to update password")
    
    return {"message": "Password changed successfully", "success": True}

