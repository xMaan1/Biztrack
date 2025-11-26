from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
import base64
import uuid
import logging

from ...models.unified_models import User, UserUpdate
from ...config.database import get_db, get_user_by_id, update_user, get_user_by_email, get_user_by_username
from ...core.auth import verify_password, get_password_hash
from ...api.dependencies import get_current_user, get_tenant_context
from ...services.rbac_service import RBACService
from ...services.s3_service import s3_service

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None

def process_avatar_upload(avatar_data: str, user_id: str) -> Optional[str]:
    if not avatar_data:
        return None
    
    if avatar_data.startswith('data:image'):
        try:
            header, encoded = avatar_data.split(',', 1)
            image_data = base64.b64decode(encoded)
            
            file_ext = '.png'
            if 'jpeg' in header or 'jpg' in header:
                file_ext = '.jpg'
            elif 'gif' in header:
                file_ext = '.gif'
            elif 'webp' in header:
                file_ext = '.webp'
            
            filename = f"avatar_{uuid.uuid4().hex}{file_ext}"
            
            result = s3_service.upload_file(
                file_content=image_data,
                tenant_id=user_id,
                folder='avatars',
                original_filename=filename
            )
            
            logger.info(f"Avatar uploaded to S3 for user {user_id}: {result['file_url']}")
            return result['file_url']
            
        except Exception as e:
            logger.error(f"Error processing avatar upload: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process avatar image: {str(e)}"
            )
    else:
        return avatar_data

@router.get("/me", response_model=User)
async def get_my_profile(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    tenant_logo_url = None
    if tenant_context:
        from ...config.core_models import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_context["tenant_id"]).first()
        if tenant:
            tenant_logo_url = tenant.logo_url
    
    return User(
        userId=str(current_user.id),
        userName=current_user.userName,
        email=current_user.email,
        firstName=current_user.firstName,
        lastName=current_user.lastName,
        userRole=current_user.userRole,
        avatar=current_user.avatar,
        tenantLogoUrl=tenant_logo_url,
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
    
    if "avatar" in update_dict:
        avatar_url = process_avatar_upload(update_dict["avatar"], str(current_user.id))
        update_dict["avatar"] = avatar_url
    
    updated_user = update_user(str(current_user.id), update_dict, db)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or could not be updated")
    
    tenant_logo_url = None
    if tenant_context:
        from ...config.core_models import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_context["tenant_id"]).first()
        if tenant:
            tenant_logo_url = tenant.logo_url
    
    return User(
        userId=str(updated_user.id),
        userName=updated_user.userName,
        email=updated_user.email,
        firstName=updated_user.firstName,
        lastName=updated_user.lastName,
        userRole=updated_user.userRole,
        avatar=updated_user.avatar,
        tenantLogoUrl=tenant_logo_url,
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

@router.delete("/avatar")
async def delete_avatar(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    user = get_user_by_id(str(current_user.id), db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.avatar and user.avatar.startswith('http') and 'avatars/' in user.avatar:
        try:
            s3_key = user.avatar.split('.amazonaws.com/')[-1]
            s3_service.delete_file(s3_key)
            logger.info(f"Avatar deleted from S3: {s3_key}")
        except Exception as e:
            logger.warning(f"Failed to delete avatar from S3: {str(e)}")
    
    update_dict = {"avatar": None}
    updated_user = update_user(str(current_user.id), update_dict, db)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="Failed to remove avatar")
    
    tenant_logo_url = None
    if tenant_context:
        from ...config.core_models import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_context["tenant_id"]).first()
        if tenant:
            tenant_logo_url = tenant.logo_url
    
    return User(
        userId=str(updated_user.id),
        userName=updated_user.userName,
        email=updated_user.email,
        firstName=updated_user.firstName,
        lastName=updated_user.lastName,
        userRole=updated_user.userRole,
        avatar=updated_user.avatar,
        tenantLogoUrl=tenant_logo_url,
        permissions=[]
    )

