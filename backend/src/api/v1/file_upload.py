from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from typing import Optional
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
import logging
from sqlalchemy.orm import Session

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...config.database import User

router = APIRouter(prefix="/file-upload", tags=["File Upload"])

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

def ensure_upload_directory():
    """Ensure upload directory exists"""
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Check content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Check file extension
    if file.filename:
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
    
    return True

@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Upload company logo for invoice customization"""
    try:
        logger.info(f"Logo upload request received: {file.filename}, size: {file.size}")
        
        if not tenant_context:
            logger.error("No tenant context provided")
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        tenant_id = tenant_context["tenant_id"]
        logger.info(f"Tenant ID: {tenant_id}")
        
        # Validate file
        validate_image_file(file)
        
        # Ensure upload directory exists
        ensure_upload_directory()
        
        # Create tenant-specific directory
        tenant_upload_dir = Path(UPLOAD_DIR) / "logos" / tenant_id
        tenant_upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix.lower() if file.filename else ".png"
        unique_filename = f"logo_{uuid.uuid4().hex}{file_extension}"
        file_path = tenant_upload_dir / unique_filename
        
        # Save file
        logger.info(f"Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file was saved
        if file_path.exists():
            logger.info(f"File saved successfully: {file_path}")
        else:
            logger.error(f"File was not saved: {file_path}")
        
        # Generate URL path (relative to static files)
        file_url = f"/static/uploads/logos/{tenant_id}/{unique_filename}"
        
        logger.info(f"Logo uploaded successfully for tenant {tenant_id}: {file_url}")
        
        return JSONResponse({
            "success": True,
            "message": "Logo uploaded successfully",
            "file_url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_size": file.size,
            "content_type": file.content_type
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@router.delete("/logo/{filename}")
async def delete_logo(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete company logo"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        tenant_id = tenant_context["tenant_id"]
        
        # Construct file path
        file_path = Path(UPLOAD_DIR) / "logos" / tenant_id / filename
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Logo file not found")
        
        # Delete file
        file_path.unlink()
        
        logger.info(f"Logo deleted successfully for tenant {tenant_id}: {filename}")
        
        return JSONResponse({
            "success": True,
            "message": "Logo deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete logo: {str(e)}")

@router.get("/logo")
async def get_logo_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get current logo information"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        tenant_id = tenant_context["tenant_id"]
        
        # Check if logo directory exists
        logo_dir = Path(UPLOAD_DIR) / "logos" / tenant_id
        
        if not logo_dir.exists():
            return JSONResponse({
                "success": True,
                "has_logo": False,
                "message": "No logo uploaded"
            })
        
        # Find logo files
        logo_files = list(logo_dir.glob("logo_*"))
        
        if not logo_files:
            return JSONResponse({
                "success": True,
                "has_logo": False,
                "message": "No logo uploaded"
            })
        
        # Get the most recent logo file
        latest_logo = max(logo_files, key=lambda f: f.stat().st_mtime)
        file_url = f"/static/uploads/logos/{tenant_id}/{latest_logo.name}"
        
        return JSONResponse({
            "success": True,
            "has_logo": True,
            "file_url": file_url,
            "filename": latest_logo.name,
            "file_size": latest_logo.stat().st_size,
            "upload_date": datetime.fromtimestamp(latest_logo.stat().st_mtime).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting logo info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get logo info: {str(e)}")
