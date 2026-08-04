import os
import mimetypes
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_teacher_or_student
from ....core.exceptions import NotFoundError, ConflictError, ValidationError
from ....core.config import settings
from ....schemas.lecture import LectureCreate, LectureUpdate, LectureResponse
from ....schemas.material import MaterialCreate, MaterialResponse
from ....schemas.common import ResponseWrapper
from ....models import LectureMaterial, CourseEnrollment, Course
from ....services.lecture_service import LectureService
from ....services.notification_service import NotificationService
from ....core.database import Base

router = APIRouter()


@router.get("/course/{course_id}", response_model=ResponseWrapper)
async def get_course_lectures(
    course_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    lectures, total = LectureService.get_course_lectures(db, course_id, skip=skip, limit=limit)
    return ResponseWrapper(
        success=True,
        message="Lectures retrieved",
        data={
            "lectures": [LectureResponse.model_validate(l, from_attributes=True) for l in lectures],
            "total": total,
        }
    )


@router.post("/course/{course_id}", response_model=ResponseWrapper, status_code=status.HTTP_201_CREATED)
async def create_lecture(
    course_id: int,
    data: LectureCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        lecture = LectureService.create_lecture(db, data, course_id)

        # Notify all enrolled students about the new lecture
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            teacher_name = course.teacher.profile.full_name if course.teacher and course.teacher.profile else "Teacher"
            enrolled_students = db.query(CourseEnrollment).filter(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.status == 'active'
            ).all()
            for enrollment in enrolled_students:
                NotificationService.create_notification(
                    db,
                    user_id=enrollment.student_id,
                    title="New Lecture Available",
                    message=f"{teacher_name} added a new lecture '{lecture.title}' in {course.title}",
                    type="info",
                    link=f"/student/my-courses/{course_id}/lectures/{lecture.id}"
                )

        return ResponseWrapper(
            success=True,
            message="Lecture created",
            data=LectureResponse.model_validate(lecture, from_attributes=True)
        )
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if isinstance(e, ConflictError) else status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": type(e).__name__, "message": str(e)}}
        )


@router.get("/{lecture_id}", response_model=ResponseWrapper)
async def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    lecture = LectureService.get_lecture_by_id(db, lecture_id)
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Lecture not found"}})
    return ResponseWrapper(
        success=True,
        message="Lecture retrieved",
        data=LectureResponse.model_validate(lecture, from_attributes=True)
    )


@router.put("/{lecture_id}", response_model=ResponseWrapper)
async def update_lecture(
    lecture_id: int,
    data: LectureUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        lecture = LectureService.update_lecture(db, lecture_id, data)
        return ResponseWrapper(
            success=True,
            message="Lecture updated",
            data=LectureResponse.model_validate(lecture, from_attributes=True)
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"error": {"code": "CONFLICT", "message": str(e)}})


async def _handle_media_upload(
    lecture_id: int,
    files: List[UploadFile],
    db: Session,
):
    lecture = LectureService.get_lecture_by_id(db, lecture_id)
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Lecture not found"}})

    media_dir = os.path.join(settings.UPLOAD_DIR, "media", "lectures", str(lecture_id))
    os.makedirs(media_dir, exist_ok=True)

    uploaded = []
    errors = []

    for file in files:
        if not file.filename:
            errors.append({"file": "unknown", "error": "No filename"})
            continue

        ext = os.path.splitext(file.filename)[1].lower()
        allowed = settings.ALLOWED_VIDEO_EXTENSIONS + settings.ALLOWED_DOCUMENT_EXTENSIONS + settings.ALLOWED_IMAGE_EXTENSIONS + [".zip", ".rar", ".7z"]
        if ext not in allowed:
            errors.append({"file": file.filename, "error": f"Invalid format {ext}"})
            continue

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_name = f"{timestamp}_{file.filename}"
        filepath = os.path.join(media_dir, safe_name)

        try:
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            errors.append({"file": file.filename, "error": str(e)})
            continue

        file_size = os.path.getsize(filepath)
        media_url = f"/uploads/media/lectures/{lecture_id}/{safe_name}"

        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"

        material = LectureMaterial(
            lecture_id=lecture_id,
            title=file.filename,
            file_name=file.filename,
            file_path=media_url,
            file_size=file_size,
            mime_type=mime_type,
            is_downloadable=True,
        )
        db.add(material)

        uploaded.append({
            "filename": file.filename,
            "url": media_url,
            "size": file_size,
            "material_id": material.id,
        })

    # Store first video URL in lecture.video_url for backward compat
    video_exts = settings.ALLOWED_VIDEO_EXTENSIONS
    for u in uploaded:
        if any(u["filename"].lower().endswith(e) for e in video_exts):
            lecture.video_url = u["url"]
            break

    db.commit()
    db.refresh(lecture)

    return ResponseWrapper(
        success=True,
        message=f"{len(uploaded)} file(s) uploaded",
        data={"uploaded": uploaded, "errors": errors if errors else None}
    )


@router.post("/{lecture_id}/upload-media", response_model=ResponseWrapper)
async def upload_lecture_media(
    lecture_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    return await _handle_media_upload(lecture_id, files, db)


# Keep old endpoint for backward compat
@router.post("/{lecture_id}/upload-video", response_model=ResponseWrapper)
async def upload_lecture_video(
    lecture_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    return await _handle_media_upload(lecture_id, [file], db)


@router.get("/{lecture_id}/materials", response_model=ResponseWrapper)
async def get_lecture_materials(
    lecture_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    materials = db.query(LectureMaterial).filter(
        LectureMaterial.lecture_id == lecture_id,
        LectureMaterial.deleted_at.is_(None)
    ).order_by(LectureMaterial.created_at.desc()).all()
    return ResponseWrapper(
        success=True,
        message="Materials retrieved",
        data=[MaterialResponse.model_validate(m, from_attributes=True) for m in materials]
    )


@router.post("/{lecture_id}/publish", response_model=ResponseWrapper)
async def publish_lecture(
    lecture_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        lecture = LectureService.publish_lecture(db, lecture_id)
        return ResponseWrapper(success=True, message="Lecture published", data=LectureResponse.model_validate(lecture, from_attributes=True))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})


@router.post("/{lecture_id}/unpublish", response_model=ResponseWrapper)
async def unpublish_lecture(
    lecture_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        lecture = LectureService.unpublish_lecture(db, lecture_id)
        return ResponseWrapper(success=True, message="Lecture unpublished", data=LectureResponse.model_validate(lecture, from_attributes=True))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})


@router.delete("/{lecture_id}", response_model=ResponseWrapper)
async def delete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        LectureService.delete_lecture(db, lecture_id)
        return ResponseWrapper(success=True, message="Lecture deleted")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})
