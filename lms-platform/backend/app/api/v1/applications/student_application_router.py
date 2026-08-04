"""
Student Application Router
Handles student application submission, status tracking, and admin management
"""
import os
import math
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_admin, get_pagination_params
from ....core.exceptions import ConflictError
from ....schemas.common import ResponseWrapper
from ....schemas.student_application import StudentApplicationSubmit, StudentApplicationResponse, StudentApplicationListResponse
from ....schemas.application import (
    ApplicationDocumentResponse,
    ApplicationStatusLogResponse,
    ApplicationRejectRequest,
    ApplicationApproveStudentRequest,
    ApplicationDashboardStats,
)
from ....services.student_application_service import StudentApplicationService

router = APIRouter()


@router.post("/student", response_model=ResponseWrapper)
async def submit_student_application(
    request: StudentApplicationSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Submit a student application (public_user only)"""
    if current_user["role"] not in ('public_user', None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Only public users can submit student applications"}}
        )
    try:
        data = request.model_dump()
        data.pop('declaration', None)

        # Convert comma-separated strings to lists where needed
        for field in ['interested_courses', 'learning_category']:
            val = data.get(field)
            if isinstance(val, str) and val.strip():
                data[field] = [s.strip() for s in val.split(',') if s.strip()]
            elif not val:
                data[field] = None

        application = StudentApplicationService.create_application(db, current_user["user_id"], data)
        return ResponseWrapper(
            success=True,
            message="Student application submitted successfully",
            data=StudentApplicationResponse.model_validate(application)
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "APPLICATION_ERROR", "message": str(e)}}
        )


@router.get("/student/my", response_model=ResponseWrapper)
async def get_my_student_application(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get current user's student application"""
    application = StudentApplicationService.get_user_application(db, current_user["user_id"])
    if not application:
        return ResponseWrapper(success=True, message="No application found", data=None)
    return ResponseWrapper(
        success=True,
        message="Application retrieved successfully",
        data=StudentApplicationResponse.model_validate(application)
    )


@router.get("/student", response_model=ResponseWrapper)
async def list_student_applications(
    page: int = 1,
    page_size: int = 20,
    status_filter: str = None,
    search: str = None,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db_session)
):
    """List all student applications (admin only)"""
    applications, total = StudentApplicationService.list_applications(db, page, page_size, status_filter, search)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return ResponseWrapper(
        success=True,
        message="Applications retrieved successfully",
        data=StudentApplicationListResponse(
            applications=[StudentApplicationResponse.model_validate(a) for a in applications],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.get("/student/stats", response_model=ResponseWrapper)
async def get_student_application_stats(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db_session)
):
    """Get student application statistics (admin only)"""
    stats = StudentApplicationService.get_dashboard_stats(db)
    return ResponseWrapper(success=True, message="Stats retrieved", data=stats)


@router.get("/student/{application_id}", response_model=ResponseWrapper)
async def get_student_application_detail(
    application_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get student application detail"""
    application = StudentApplicationService.get_application(db, application_id)
    if current_user["role"] != 'admin' and application.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail={"error": {"message": "Access denied"}})

    documents = StudentApplicationService.get_documents(db, application_id)
    logs = StudentApplicationService.get_status_logs(db, application_id)

    return ResponseWrapper(
        success=True,
        message="Application retrieved",
        data={
            "application": StudentApplicationResponse.model_validate(application),
            "documents": [ApplicationDocumentResponse.model_validate(d) for d in documents],
            "status_logs": [ApplicationStatusLogResponse.model_validate(l) for l in logs],
        }
    )


@router.post("/student/{application_id}/review", response_model=ResponseWrapper)
async def review_student_application(
    application_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db_session)
):
    """Mark student application as reviewed (admin only)"""
    try:
        application = StudentApplicationService.review_application(
            db, application_id, current_user["user_id"]
        )
        return ResponseWrapper(
            success=True,
            message="Application marked as reviewed",
            data=StudentApplicationResponse.model_validate(application)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": {"message": str(e)}})


@router.post("/student/{application_id}/approve", response_model=ResponseWrapper)
async def approve_student_application(
    application_id: int,
    request: ApplicationApproveStudentRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db_session)
):
    """Approve student application and convert user to student (admin only)"""
    try:
        application = StudentApplicationService.approve_application(
            db, application_id, current_user["user_id"],
            admin_remarks=request.admin_remarks
        )
        return ResponseWrapper(
            success=True,
            message="Application approved. User has been converted to student.",
            data=StudentApplicationResponse.model_validate(application)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": {"message": str(e)}})


@router.post("/student/{application_id}/reject", response_model=ResponseWrapper)
async def reject_student_application(
    application_id: int,
    request: ApplicationRejectRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db_session)
):
    """Reject student application (admin only)"""
    try:
        application = StudentApplicationService.reject_application(
            db, application_id, current_user["user_id"],
            rejection_reason=request.rejection_reason,
            admin_remarks=request.admin_remarks
        )
        return ResponseWrapper(
            success=True,
            message="Application rejected",
            data=StudentApplicationResponse.model_validate(application)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": {"message": str(e)}})


@router.post("/student/{application_id}/upload", response_model=ResponseWrapper)
async def upload_student_application_document(
    application_id: int,
    document_type: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Upload a document for student application"""
    application = StudentApplicationService.get_application(db, application_id)
    if application.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail={"error": {"message": "Access denied"}})

    upload_dir = os.path.join("uploads", "applications", "student", str(application_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = StudentApplicationService.upload_document(
        db, application_id, document_type,
        file_name=file.filename,
        file_path=f"/uploads/applications/student/{application_id}/{file.filename}",
        file_size=len(content),
        mime_type=file.content_type
    )
    return ResponseWrapper(
        success=True,
        message="Document uploaded successfully",
        data=ApplicationDocumentResponse.model_validate(doc)
    )


@router.get("/student/{application_id}/documents/{doc_id}/download")
async def download_student_document(
    application_id: int,
    doc_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Download a document"""
    from fastapi.responses import FileResponse
    from ....models import ApplicationDocument
    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_type == 'student',
        ApplicationDocument.application_id == application_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = doc.file_path.lstrip('/')
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(file_path, filename=doc.file_name, media_type=doc.mime_type)
