from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_student, require_teacher_or_student
from ....core.exceptions import NotFoundError
from ....schemas.live_session import LiveSessionCreate, LiveSessionUpdate, LiveSessionResponse
from ....schemas.common import ResponseWrapper
from ....services.live_session_service import LiveSessionService
from ....services.notification_service import NotificationService
from ....models import CourseEnrollment

router = APIRouter()


@router.post("", response_model=ResponseWrapper, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: LiveSessionCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    session = LiveSessionService.create_session(db, current_user["user_id"], data)
    return ResponseWrapper(
        success=True,
        message="Live session created",
        data=LiveSessionResponse.model_validate(session, from_attributes=True)
    )


@router.get("/my-sessions", response_model=ResponseWrapper)
async def get_my_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    sessions, total = LiveSessionService.get_teacher_sessions(db, current_user["user_id"], skip=skip, limit=limit)
    return ResponseWrapper(
        success=True,
        message="Sessions retrieved",
        data={
            "sessions": [LiveSessionResponse.model_validate(s, from_attributes=True) for s in sessions],
            "total": total,
        }
    )


@router.get("/join/{session_code}", response_model=ResponseWrapper)
async def get_session_by_code(
    session_code: str,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    session = LiveSessionService.get_session_by_code(db, session_code)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Session not found"}})
    return ResponseWrapper(
        success=True,
        message="Session found",
        data=LiveSessionResponse.model_validate(session, from_attributes=True)
    )


@router.get("/active/courses", response_model=ResponseWrapper)
async def get_active_sessions_for_student(
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_student)
):
    enrolled_course_ids = [
        e.course_id for e in db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == current_user["user_id"],
            CourseEnrollment.status == 'active'
        ).all()
    ]
    sessions = LiveSessionService.get_active_sessions_for_courses(db, enrolled_course_ids)
    return ResponseWrapper(
        success=True,
        message="Active sessions retrieved",
        data=[LiveSessionResponse.model_validate(s, from_attributes=True) for s in sessions]
    )


@router.get("/{session_id}", response_model=ResponseWrapper)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    session = LiveSessionService.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Session not found"}})
    return ResponseWrapper(
        success=True,
        message="Session retrieved",
        data=LiveSessionResponse.model_validate(session, from_attributes=True)
    )


@router.post("/{session_id}/start", response_model=ResponseWrapper)
async def start_session(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        session = LiveSessionService.start_session(db, session_id, current_user["user_id"])

        teacher_name = current_user.get("full_name", "A teacher")
        link = f"/student/my-courses/{session.course_id}/lectures/{session.lecture_id}" if session.lecture_id else f"/student/live-lecture/{session.id}"
        enrolled = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == session.course_id,
            CourseEnrollment.status == 'active'
        ).all()
        for enrollment in enrolled:
            NotificationService.create_notification(
                db,
                user_id=enrollment.student_id,
                title="Live Session Started",
                message=f"{teacher_name} started a live session: {session.title}",
                type="info",
                link=link
            )

        return ResponseWrapper(success=True, message="Session started", data=LiveSessionResponse.model_validate(session, from_attributes=True))
    except (NotFoundError, PermissionError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{session_id}/end", response_model=ResponseWrapper)
async def end_session(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        session = LiveSessionService.end_session(db, session_id, current_user["user_id"])
        return ResponseWrapper(success=True, message="Session ended", data=LiveSessionResponse.model_validate(session, from_attributes=True))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/join/{session_code}", response_model=ResponseWrapper)
async def join_live_session(
    session_code: str,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    try:
        session = LiveSessionService.join_session(db, session_code, current_user["user_id"])
        return ResponseWrapper(success=True, message="Joined session", data=LiveSessionResponse.model_validate(session, from_attributes=True))
    except (NotFoundError, PermissionError) as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{session_id}", response_model=ResponseWrapper)
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher),
):
    try:
        LiveSessionService.delete_session(db, session_id, current_user["user_id"])
        return ResponseWrapper(success=True, message="Session deleted")
    except (NotFoundError, PermissionError) as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
