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
from ...services.s3_service import s3_service

router = APIRouter(prefix="/file-upload", tags=["File Upload"])

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB for documents
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"]

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
        
        # Read file content
        file_content = await file.read()
        
        # Upload to S3
        result = s3_service.upload_logo(
            file_content=file_content,
            tenant_id=tenant_id,
            original_filename=file.filename
        )
        
        logger.info(f"Logo uploaded successfully for tenant {tenant_id}: {result['file_url']}")
        
        return JSONResponse({
            "success": True,
            "message": "Logo uploaded successfully",
            "file_url": result["file_url"],
            "filename": result["filename"],
            "original_filename": result["original_filename"],
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
        
        # Construct S3 key
        s3_key = f"logos/{tenant_id}/{filename}"
        
        # Delete from S3
        success = s3_service.delete_logo(s3_key)
        
        if not success:
            raise HTTPException(status_code=404, detail="Logo file not found or could not be deleted")
        
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
        
        # Get logos from S3
        logos = s3_service.list_tenant_logos(tenant_id)
        
        if not logos:
            return JSONResponse({
                "success": True,
                "has_logo": False,
                "message": "No logo uploaded"
            })
        
        # Get the most recent logo file
        latest_logo = max(logos, key=lambda f: f['last_modified'])
        
        return JSONResponse({
            "success": True,
            "has_logo": True,
            "file_url": latest_logo['url'],
            "filename": latest_logo['filename'],
            "file_size": latest_logo['size'],
            "upload_date": latest_logo['last_modified'].isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting logo info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get logo info: {str(e)}")

def validate_document_file(file: UploadFile) -> bool:
    """Validate uploaded document file"""
    if file.size and file.size > MAX_DOCUMENT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {MAX_DOCUMENT_SIZE // (1024*1024)}MB"
        )
    
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_DOCUMENT_TYPES)}"
        )
    
    if file.filename:
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_DOCUMENT_EXTENSIONS)}"
            )
    
    return True

@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Upload a document file"""
    try:
        logger.info(f"Document upload request received: {file.filename}, size: {file.size}")
        
        if not tenant_context:
            logger.error("No tenant context provided")
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        tenant_id = tenant_context["tenant_id"]
        
        validate_document_file(file)
        
        file_content = await file.read()
        
        result = s3_service.upload_file(
            file_content=file_content,
            tenant_id=tenant_id,
            folder="documents",
            original_filename=file.filename
        )
        
        logger.info(f"Document uploaded successfully for tenant {tenant_id}: {result['file_url']}")
        
        return JSONResponse({
            "success": True,
            "message": "Document uploaded successfully",
            "file_url": result["file_url"],
            "filename": result["filename"],
            "original_filename": result["original_filename"],
            "s3_key": result["s3_key"],
            "file_size": file.size,
            "content_type": file.content_type
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.post("/employee/{category}")
async def upload_employee_file(
    category: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Upload employee file (resume or attachment)"""
    try:
        logger.info(f"Employee file upload request: {category}, {file.filename}, size: {file.size}")
        
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        if category not in ["resume", "attachment"]:
            raise HTTPException(status_code=400, detail="Category must be 'resume' or 'attachment'")
        
        tenant_id = tenant_context["tenant_id"]
        
        validate_document_file(file)
        
        file_content = await file.read()
        
        result = s3_service.upload_file(
            file_content=file_content,
            tenant_id=tenant_id,
            folder=f"employees/{category}",
            original_filename=file.filename
        )
        
        logger.info(f"Employee file uploaded successfully: {result['file_url']}")
        
        return JSONResponse({
            "success": True,
            "message": f"{category.title()} uploaded successfully",
            "file_url": result["file_url"],
            "filename": result["filename"],
            "original_filename": result["original_filename"],
            "s3_key": result["s3_key"],
            "file_size": file.size,
            "content_type": file.content_type
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading employee file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload {category}: {str(e)}")
