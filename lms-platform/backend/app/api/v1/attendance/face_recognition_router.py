"""
Face Recognition Router
Handles face recognition for attendance
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_teacher_or_student
from ....core.exceptions import FaceRecognitionError, NotFoundError
from ....schemas.attendance import FaceRecognitionRequest, FaceRecognitionResponse
from ....schemas.common import ResponseWrapper
from ....services.face_recognition_service import FaceRecognitionService

router = APIRouter()


@router.post("/recognize", response_model=ResponseWrapper)
async def recognize_face(
    request: FaceRecognitionRequest,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Recognize a face for attendance marking (Teacher/Admin only)
    """
    try:
        result = await FaceRecognitionService.recognize_face(
            db,
            request.session_id,
            request.image_data,
            request.student_id
        )
        
        return ResponseWrapper(
            success=True,
            message="Face recognition completed",
            data=FaceRecognitionResponse(
                success=result["success"],
                student_id=result.get("student_id"),
                student_name=result.get("student_name"),
                confidence=result.get("confidence", 0),
                message=result.get("message", "Recognition completed")
            )
        )
    except FaceRecognitionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "FACE_RECOGNITION_ERROR", "message": str(e)}}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/enroll", response_model=ResponseWrapper)
async def enroll_face(
    student_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Enroll a student's face for recognition (Teacher/Admin only)
    """
    try:
        # Read image data
        image_data = await image.read()
        
        result = await FaceRecognitionService.enroll_face(
            db,
            student_id,
            image_data
        )
        
        return ResponseWrapper(
            success=True,
            message="Face enrolled successfully",
            data=result
        )
    except FaceRecognitionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "FACE_RECOGNITION_ERROR", "message": str(e)}}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.delete("/enroll/{student_id}", response_model=ResponseWrapper)
async def remove_face_encoding(
    student_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Remove a student's face encoding (Teacher/Admin only)
    """
    try:
        result = await FaceRecognitionService.remove_face_encoding(db, student_id)
        
        return ResponseWrapper(
            success=True,
            message="Face encoding removed successfully",
            data={"student_id": student_id}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )