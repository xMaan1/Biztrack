from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_student, require_teacher, require_admin
from ....core.exceptions import NotFoundError, ConflictError, ValidationError
from ....schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentListResponse
from ....schemas.course import CourseResponse
from ....schemas.common import ResponseWrapper
from ....services.enrollment_service import EnrollmentService
from ....services.course_service import CourseService
from ....services.notification_service import NotificationService
from ....models import CourseEnrollment, Course, User, Role

router = APIRouter()


def _serialize_enrollment(e):
    return {
        "id": e.id,
        "course_id": e.course_id,
        "course_title": e.course.title if e.course else None,
        "course_code": e.course.code if e.course else None,
        "student_id": e.student_id,
        "student_name": e.student.profile.full_name if e.student and e.student.profile else None,
        "enrollment_date": str(e.enrollment_date) if e.enrollment_date else None,
        "status": e.status,
        "grade": e.grade,
        "grade_points": float(e.grade_points) if e.grade_points else None,
        "completion_percentage": float(e.completion_percentage) if e.completion_percentage else 0.0,
        "dropped_at": str(e.dropped_at) if e.dropped_at else None,
        "created_at": str(e.created_at) if e.created_at else None,
        "updated_at": str(e.updated_at) if e.updated_at else None,
    }


@router.post("/", response_model=ResponseWrapper)
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_student)
):
    try:
        enrollment_data = EnrollmentCreate(course_id=course_id, student_id=current_user["user_id"])
        enrollment = EnrollmentService.enroll_student(db, enrollment_data)

        course = db.query(Course).filter(Course.id == course_id).first()
        if course and course.teacher:
            NotificationService.create_notification(
                db,
                user_id=course.teacher_id,
                title="New Student Enrolled",
                message=f"A new student has enrolled in your course '{course.title}'",
                type="info",
                link=f"/teacher/courses/{course_id}/students"
            )

        return ResponseWrapper(
            success=True,
            message="Enrolled successfully",
            data=_serialize_enrollment(enrollment)
        )
    except (NotFoundError, ConflictError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": type(e).__name__, "message": str(e)}}
        )


@router.get("/my-enrollments", response_model=ResponseWrapper)
async def get_my_enrollments(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    student_id = current_user["user_id"]
    enrollments = EnrollmentService.get_student_enrollments(db, student_id, status=status_filter)
    return ResponseWrapper(
        success=True,
        message="Enrollments retrieved",
        data=[_serialize_enrollment(e) for e in enrollments]
    )


@router.get("/students/{student_id}", response_model=ResponseWrapper)
async def get_student_enrollments(
    student_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    enrollments = EnrollmentService.get_student_enrollments(db, student_id)
    return ResponseWrapper(
        success=True,
        message="Student enrollments retrieved",
        data=[_serialize_enrollment(e) for e in enrollments]
    )


@router.get("/courses/{course_id}", response_model=ResponseWrapper)
async def get_course_enrollments(
    course_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    skip = (page - 1) * page_size
    enrollments, total = EnrollmentService.get_course_enrollments(db, course_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size
    return ResponseWrapper(
        success=True,
        message="Course enrollments retrieved",
        data=EnrollmentListResponse(
            enrollments=[_serialize_enrollment(e) for e in enrollments],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.put("/{enrollment_id}", response_model=ResponseWrapper)
async def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    try:
        enrollment = EnrollmentService.update_enrollment(db, enrollment_id, enrollment_data)
        return ResponseWrapper(
            success=True,
            message="Enrollment updated",
            data=_serialize_enrollment(enrollment)
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.delete("/{enrollment_id}", response_model=ResponseWrapper)
async def drop_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_student)
):
    try:
        enrollment = EnrollmentService.get_enrollment_by_id(db, enrollment_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "NOT_FOUND", "message": "Enrollment not found"}}
            )

        if current_user["role"] == "student" and enrollment.student_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "PERMISSION_DENIED", "message": "You can only drop your own enrollments"}}
            )

        EnrollmentService.drop_enrollment(db, enrollment_id)
        return ResponseWrapper(success=True, message="Enrollment dropped")
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.get("/available-courses", response_model=ResponseWrapper)
async def get_available_courses(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_student)
):
    student_id = current_user["user_id"]
    enrolled_course_ids = [
        e.course_id for e in EnrollmentService.get_student_enrollments(db, student_id)
    ]
    courses, total = CourseService.get_courses(
        db, skip=0, limit=1000,
        search=search,
        is_published=True
    )
    available = [c for c in courses if c.id not in enrolled_course_ids]
    return ResponseWrapper(
        success=True,
        message="Available courses retrieved",
        data=[{
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "credits": c.credits,
            "department_name": c.department.name if c.department else None,
            "teacher_name": c.teacher.profile.full_name if c.teacher and c.teacher.profile else None,
            "semester": c.semester,
            "academic_year": c.academic_year,
            "max_students": c.max_students,
            "current_enrollment": c.current_enrollment,
            "thumbnail_url": c.thumbnail_url,
            "start_date": str(c.start_date) if c.start_date else None,
            "end_date": str(c.end_date) if c.end_date else None,
        } for c in available]
    )
