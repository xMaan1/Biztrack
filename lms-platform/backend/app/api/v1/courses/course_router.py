"""
Course Router
Handles course management endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_admin, require_teacher_or_student
from ....core.exceptions import NotFoundError, ConflictError, ValidationError
from ....schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse
from ....schemas.common import ResponseWrapper, PaginationParams
from ....schemas.course_deletion import CourseDeletionRequestCreate, CourseDeletionRequestReview
from ....services.course_service import CourseService
from ....services.notification_service import NotificationService
from ....models import User
from ....models import Course
from ....models import CourseEnrollment
from ....models.course_deletion_request import CourseDeletionRequest

router = APIRouter()


@router.get("/", response_model=ResponseWrapper)
async def get_courses(
    search: Optional[str] = Query(None, description="Search term"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    teacher_id: Optional[int] = Query(None, description="Filter by teacher"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of courses with filters and pagination
    """
    skip = (page - 1) * page_size
    
    courses, total = CourseService.get_courses(
        db,
        skip=skip,
        limit=page_size,
        search=search,
        department_id=department_id,
        teacher_id=teacher_id,
        semester=semester,
        is_published=is_published
    )

    # Convert to response format
    course_responses = []
    for course in courses:
        course_responses.append(CourseResponse(
            id=course.id,
            title=course.title,
            code=course.code,
            description=course.description,
            credits=course.credits,
            department_id=course.department_id,
            department_name=course.department.name if course.department else None,
            teacher_id=course.teacher_id,
            teacher_name=course.teacher.profile.full_name if course.teacher and course.teacher.profile else None,
            semester=course.semester,
            academic_year=course.academic_year,
            max_students=course.max_students,
            current_enrollment=course.current_enrollment,
            start_date=course.start_date,
            end_date=course.end_date,
            is_published=course.is_published,
            thumbnail_url=course.thumbnail_url,
            syllabus_url=course.syllabus_url,
            created_at=course.created_at,
            updated_at=course.updated_at
        ))

    total_pages = (total + page_size - 1) // page_size

    return ResponseWrapper(
        success=True,
        message="Courses retrieved successfully",
        data=CourseListResponse(
            courses=course_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.get("/{course_id}", response_model=ResponseWrapper)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get course details by ID
    """
    try:
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        return ResponseWrapper(
            success=True,
            message="Course retrieved successfully",
            data=CourseResponse(
                id=course.id,
                title=course.title,
                code=course.code,
                description=course.description,
                credits=course.credits,
                department_id=course.department_id,
                department_name=course.department.name if course.department else None,
                teacher_id=course.teacher_id,
                teacher_name=course.teacher.profile.full_name if course.teacher and course.teacher.profile else None,
                semester=course.semester,
                academic_year=course.academic_year,
                max_students=course.max_students,
                current_enrollment=course.current_enrollment,
                start_date=course.start_date,
                end_date=course.end_date,
                is_published=course.is_published,
                thumbnail_url=course.thumbnail_url,
                syllabus_url=course.syllabus_url,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/", response_model=ResponseWrapper)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
     Create a new course (Teacher/Admin only)
    """
    try:
        if current_user.get("role") == "teacher":
            course_data.teacher_id = current_user["user_id"]
        course = CourseService.create_course(db, course_data)

        # Notify only admins about the new course (so they can publish it)
        teacher_name = course.teacher.profile.full_name if course.teacher and course.teacher.profile else course.teacher.email
        admins = db.query(User).filter(
            User.deleted_at.is_(None),
            User.role == "admin"
        ).all()
        for admin in admins:
            NotificationService.create_notification(
                db, admin.id,
                title="New Course Created (Draft)",
                message=f"{teacher_name} created a new course: {course.title} ({course.code}) — review and publish it",
                type="info",
                link=f"/admin/courses/{course.id}"
            )

        # Also notify all teachers about the new course
        teachers = db.query(User).filter(User.role == 'teacher', User.deleted_at.is_(None)).all()
        for teacher in teachers:
            if teacher.id != course.teacher_id:  # Don't notify the creator
                NotificationService.create_notification(
                    db, teacher.id,
                    title="New Course Created",
                    message=f"{teacher_name} created a new course: {course.title} ({course.code})",
                    type="info",
                    link=f"/teacher/courses/{course.id}"
                )

        return ResponseWrapper(
            success=True,
            message="Course created successfully",
            data=CourseResponse(
                id=course.id,
                title=course.title,
                code=course.code,
                description=course.description,
                credits=course.credits,
                department_id=course.department_id,
                department_name=course.department.name if course.department else None,
                teacher_id=course.teacher_id,
                teacher_name=course.teacher.profile.full_name if course.teacher and course.teacher.profile else None,
                semester=course.semester,
                academic_year=course.academic_year,
                max_students=course.max_students,
                current_enrollment=course.current_enrollment,
                start_date=course.start_date,
                end_date=course.end_date,
                is_published=course.is_published,
                thumbnail_url=course.thumbnail_url,
                syllabus_url=course.syllabus_url,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.put("/{course_id}", response_model=ResponseWrapper)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Update a course (Teacher/Admin only)
    """
    try:
        existing_course = CourseService.get_course_by_id(db, course_id)
        if not existing_course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)
        if current_user.get("role") == "teacher" and existing_course.teacher_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "FORBIDDEN", "message": "You can only update your own courses"}}
            )

        course = CourseService.update_course(db, course_id, course_data)

        # Notify teacher if admin updated
        if current_user.get("role") == "admin" and course.teacher_id != current_user["user_id"]:
            NotificationService.create_notification(
                db, course.teacher_id,
                title="Course Updated",
                message=f"Your course '{course.title}' has been updated by an administrator.",
                type="info",
                link=f"/teacher/courses/{course.id}"
            )
        # Notify enrolled students
        enrolled = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'active'
        ).all()
        for e in enrolled:
            NotificationService.create_notification(
                db, e.student_id,
                title="Course Updated",
                message=f"Course '{course.title}' has been updated. Check for new content.",
                type="info",
                link=f"/student/courses/{course.id}"
            )

        return ResponseWrapper(
            success=True,
            message="Course updated successfully",
            data=CourseResponse(
                id=course.id,
                title=course.title,
                code=course.code,
                description=course.description,
                credits=course.credits,
                department_id=course.department_id,
                department_name=course.department.name if course.department else None,
                teacher_id=course.teacher_id,
                teacher_name=course.teacher.profile.full_name if course.teacher and course.teacher.profile else None,
                semester=course.semester,
                academic_year=course.academic_year,
                max_students=course.max_students,
                current_enrollment=course.current_enrollment,
                start_date=course.start_date,
                end_date=course.end_date,
                is_published=course.is_published,
                thumbnail_url=course.thumbnail_url,
                syllabus_url=course.syllabus_url,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )


@router.post("/{course_id}/publish", response_model=ResponseWrapper)
async def publish_course(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Publish a course (Admin only)
    """
    try:
        course = CourseService.publish_course(db, course_id)

        # Notify all students about the newly published course
        teacher_name = course.teacher.profile.full_name if course.teacher and course.teacher.profile else "Teacher"
        students = db.query(User).filter(
            User.deleted_at.is_(None),
            User.role == "student"
        ).all()
        for student in students:
            NotificationService.create_notification(
                db, student.id,
                title="New Course Available",
                message=f"A new course '{course.title}' ({course.code}) by {teacher_name} is now available. Enroll now!",
                type="info",
                link="/student/courses"
            )

        return ResponseWrapper(
            success=True,
            message="Course published successfully",
            data={"is_published": course.is_published}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/{course_id}/unpublish", response_model=ResponseWrapper)
async def unpublish_course(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Unpublish a course (Admin only)
    """
    try:
        course = CourseService.unpublish_course(db, course_id)

        # Notify teacher
        NotificationService.create_notification(
            db, course.teacher_id,
            title="Course Unpublished",
            message=f"Your course '{course.title}' has been unpublished and is no longer visible to students.",
            type="warning",
            link=f"/teacher/courses/{course.id}"
        )
        return ResponseWrapper(
            success=True,
            message="Course unpublished successfully",
            data={"is_published": course.is_published}
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.delete("/{course_id}", response_model=ResponseWrapper)
async def delete_course(
    course_id: int,
    permanent: bool = Query(False, description="Permanently delete"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Delete a course (Admin only)
    """
    try:
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        CourseService.delete_course(db, course_id, soft_delete=not permanent)

        # Notify teacher
        NotificationService.create_notification(
            db, course.teacher_id,
            title="Course Deleted",
            message=f"Your course '{course.title}' has been deleted.",
            type="warning",
            link="/teacher/courses"
        )
        # Notify enrolled students
        enrolled = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'active'
        ).all()
        for e in enrolled:
            NotificationService.create_notification(
                db, e.student_id,
                title="Course Removed",
                message=f"Course '{course.title}' has been removed. You no longer have access.",
                type="warning",
                link="/student/courses"
            )

        return ResponseWrapper(
            success=True,
            message="Course deleted successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/{course_id}/request-deletion", response_model=ResponseWrapper)
async def request_course_deletion(
    course_id: int,
    request_body: CourseDeletionRequestCreate = CourseDeletionRequestCreate(),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """Teacher requests course deletion"""
    course = CourseService.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail={"error": {"message": "Course not found"}})
    if current_user.get("role") == "teacher" and course.teacher_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail={"error": {"message": "You can only request deletion of your own courses"}})

    # Check for existing pending request
    existing = db.query(CourseDeletionRequest).filter(
        CourseDeletionRequest.course_id == course_id,
        CourseDeletionRequest.status == 'pending'
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail={"error": {"message": "A pending deletion request already exists"}})

    deletion_request = CourseDeletionRequest(
        course_id=course_id,
        requested_by=current_user["user_id"],
        reason=request_body.reason
    )
    db.add(deletion_request)
    db.flush()

    # Unpublish the course (hide from students)
    course.is_published = False
    db.flush()

    # Notify admins
    admins = db.query(User).filter(User.role == 'admin', User.deleted_at.is_(None)).all()
    for admin in admins:
        NotificationService.create_notification(
            db, admin.id,
            title="Course Deletion Request",
            message=f"Teacher has requested deletion of course '{course.title}'. Review and approve/reject.",
            type="warning",
            link="/admin/course-deletions"
        )

    # Notify enrolled students
    enrolled = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.status == 'active'
    ).all()
    for e in enrolled:
        NotificationService.create_notification(
            db, e.student_id,
            title="Course Access Removed",
            message=f"Course '{course.title}' has been temporarily removed from your dashboard pending admin review.",
            type="warning",
            link="/student/courses"
        )

    db.commit()
    db.refresh(deletion_request)

    return ResponseWrapper(
        success=True,
        message="Deletion request submitted. Course has been unpublished pending admin approval.",
        data={"id": deletion_request.id, "status": deletion_request.status}
    )


@router.get("/deletion-requests", response_model=ResponseWrapper)
async def list_deletion_requests(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """List course deletion requests (Admin only)"""
    from sqlalchemy import desc
    query = db.query(CourseDeletionRequest)
    if status_filter:
        query = query.filter(CourseDeletionRequest.status == status_filter)
    requests = query.order_by(desc(CourseDeletionRequest.created_at)).all()

    result = []
    for r in requests:
        course = db.query(Course).filter(Course.id == r.course_id).first()
        requester = db.query(User).filter(User.id == r.requested_by).first()
        result.append({
            "id": r.id,
            "course_id": r.course_id,
            "course_title": course.title if course else "Deleted",
            "requested_by": r.requested_by,
            "requester_name": requester.profile.full_name if requester and requester.profile else (requester.email if requester else "Unknown"),
            "status": r.status,
            "reason": r.reason,
            "admin_remarks": r.admin_remarks,
            "created_at": str(r.created_at) if r.created_at else None,
        })

    return ResponseWrapper(success=True, message="Deletion requests retrieved", data=result)


@router.post("/deletion-requests/{request_id}/approve", response_model=ResponseWrapper)
async def approve_course_deletion(
    request_id: int,
    body: CourseDeletionRequestReview = CourseDeletionRequestReview(),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """Approve course deletion (Admin only) - permanently deletes"""
    from datetime import datetime as dt

    del_req = db.query(CourseDeletionRequest).filter(CourseDeletionRequest.id == request_id).first()
    if not del_req:
        raise HTTPException(status_code=404, detail={"error": {"message": "Request not found"}})
    if del_req.status != 'pending':
        raise HTTPException(status_code=400, detail={"error": {"message": f"Request already {del_req.status}"}})

    del_req.status = 'approved'
    del_req.reviewed_by = current_user["user_id"]
    del_req.reviewed_at = dt.now()
    del_req.admin_remarks = body.admin_remarks

    # Permanently delete the course
    CourseService.delete_course(db, del_req.course_id, soft_delete=False)

    db.commit()

    return ResponseWrapper(success=True, message="Course deletion approved and course permanently deleted")


@router.post("/deletion-requests/{request_id}/reject", response_model=ResponseWrapper)
async def reject_course_deletion(
    request_id: int,
    body: CourseDeletionRequestReview = CourseDeletionRequestReview(),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """Reject course deletion (Admin only) - republish course"""
    from datetime import datetime as dt

    del_req = db.query(CourseDeletionRequest).filter(CourseDeletionRequest.id == request_id).first()
    if not del_req:
        raise HTTPException(status_code=404, detail={"error": {"message": "Request not found"}})
    if del_req.status != 'pending':
        raise HTTPException(status_code=400, detail={"error": {"message": f"Request already {del_req.status}"}})

    del_req.status = 'rejected'
    del_req.reviewed_by = current_user["user_id"]
    del_req.reviewed_at = dt.now()
    del_req.admin_remarks = body.admin_remarks

    # Republish the course
    course = CourseService.get_course_by_id(db, del_req.course_id)
    if course:
        course.is_published = True
        # Notify teacher
        NotificationService.create_notification(
            db, course.teacher_id,
            title="Deletion Request Rejected",
            message=f"Your deletion request for course '{course.title}' has been rejected. The course has been republished.",
            type="info",
            link=f"/teacher/courses/{course.id}"
        )

    db.commit()

    return ResponseWrapper(success=True, message="Course deletion rejected. Course has been republished.")