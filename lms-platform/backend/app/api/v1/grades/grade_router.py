"""
Grade Router
Handles grade management and reporting
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_student, require_teacher_or_student, require_admin
from ....core.exceptions import NotFoundError, ValidationError
from ....schemas.grade import GradeCreate, GradeUpdate, GradeResponse, GradeSummaryResponse
from ....schemas.common import ResponseWrapper
from ....services.grade_service import GradeService
from ....services.notification_service import NotificationService
from ....models import CourseEnrollment

router = APIRouter()


@router.get("/students/{student_id}", response_model=ResponseWrapper)
async def get_student_grades(
    student_id: int,
    course_id: Optional[int] = Query(None, description="Filter by course"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher_or_student)
):
    """
    Get grades for a student
    """
    try:
        # Check if user has permission
        if current_user["role"] == "student" and current_user["user_id"] != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "PERMISSION_DENIED", "message": "You can only view your own grades"}}
            )
        
        grades = GradeService.get_student_grades(db, student_id, course_id)
        
        grade_responses = []
        for grade in grades:
            grade_responses.append(GradeResponse(
                id=grade.id,
                enrollment_id=grade.enrollment_id,
                assignment_id=grade.assignment_id,
                assignment_title=grade.assignment.title if grade.assignment else None,
                score=grade.score,
                letter_grade=grade.letter_grade,
                percentage=grade.percentage,
                feedback=grade.feedback,
                graded_by=grade.graded_by,
                grader_name=grade.grader.profile.full_name if grade.grader and grade.grader.profile else None,
                graded_at=grade.graded_at,
                created_at=grade.created_at,
                updated_at=grade.updated_at
            ))
        
        return ResponseWrapper(
            success=True,
            message="Grades retrieved successfully",
            data={
                "grades": grade_responses,
                "total": len(grade_responses)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/courses/{course_id}", response_model=ResponseWrapper)
async def get_course_grades(
    course_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get grades for a course (Teacher/Admin only)
    """
    try:
        skip = (page - 1) * page_size
        
        grades, total = GradeService.get_course_grades(
            db,
            course_id,
            skip=skip,
            limit=page_size
        )
        
        grade_responses = []
        for grade in grades:
            grade_responses.append(GradeResponse(
                id=grade.id,
                enrollment_id=grade.enrollment_id,
                assignment_id=grade.assignment_id,
                assignment_title=grade.assignment.title if grade.assignment else None,
                score=grade.score,
                letter_grade=grade.letter_grade,
                percentage=grade.percentage,
                feedback=grade.feedback,
                graded_by=grade.graded_by,
                grader_name=grade.grader.profile.full_name if grade.grader and grade.grader.profile else None,
                graded_at=grade.graded_at,
                created_at=grade.created_at,
                updated_at=grade.updated_at
            ))
        
        total_pages = (total + page_size - 1) // page_size
        
        return ResponseWrapper(
            success=True,
            message="Grades retrieved successfully",
            data={
                "grades": grade_responses,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.post("/", response_model=ResponseWrapper)
async def create_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Create a new grade (Teacher/Admin only)
    """
    try:
        grade_data.graded_by = current_user["user_id"]
        grade = GradeService.create_grade(db, grade_data)

        enrollment = db.query(CourseEnrollment).filter(CourseEnrollment.id == grade.enrollment_id).first()
        if enrollment:
            NotificationService.create_notification(
                db,
                user_id=enrollment.student_id,
                title="New Grade Posted",
                message=f"Your grade for '{grade.assignment.title if grade.assignment else 'assignment'}' has been posted — Score: {grade.score}",
                type="success",
                link=f"/student/assignments/{grade.assignment_id}" if grade.assignment_id else None
            )
        
        return ResponseWrapper(
            success=True,
            message="Grade created successfully",
            data=GradeResponse(
                id=grade.id,
                enrollment_id=grade.enrollment_id,
                assignment_id=grade.assignment_id,
                assignment_title=grade.assignment.title if grade.assignment else None,
                score=grade.score,
                letter_grade=grade.letter_grade,
                percentage=grade.percentage,
                feedback=grade.feedback,
                graded_by=grade.graded_by,
                grader_name=current_user.get("full_name"),
                graded_at=grade.graded_at,
                created_at=grade.created_at,
                updated_at=grade.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(e)}}
        )


@router.put("/{grade_id}", response_model=ResponseWrapper)
async def update_grade(
    grade_id: int,
    grade_data: GradeUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Update a grade (Teacher/Admin only)
    """
    try:
        grade = GradeService.update_grade(db, grade_id, grade_data)
        
        return ResponseWrapper(
            success=True,
            message="Grade updated successfully",
            data=GradeResponse(
                id=grade.id,
                enrollment_id=grade.enrollment_id,
                assignment_id=grade.assignment_id,
                assignment_title=grade.assignment.title if grade.assignment else None,
                score=grade.score,
                letter_grade=grade.letter_grade,
                percentage=grade.percentage,
                feedback=grade.feedback,
                graded_by=grade.graded_by,
                grader_name=current_user.get("full_name"),
                graded_at=grade.graded_at,
                created_at=grade.created_at,
                updated_at=grade.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.get("/students/{student_id}/summary", response_model=ResponseWrapper)
async def get_student_grade_summary(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher_or_student)
):
    """
    Get grade summary for a student in a course
    """
    try:
        # Check if user has permission
        if current_user["role"] == "student" and current_user["user_id"] != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "PERMISSION_DENIED", "message": "You can only view your own grades"}}
            )
        
        summary = GradeService.get_student_course_summary(db, student_id, course_id)
        
        return ResponseWrapper(
            success=True,
            message="Grade summary retrieved successfully",
            data=GradeSummaryResponse(
                student_id=summary["student_id"],
                student_name=summary.get("student_name"),
                course_id=summary["course_id"],
                course_title=summary.get("course_title"),
                total_assignments=summary["total_assignments"],
                graded_assignments=summary["graded_assignments"],
                average_score=summary["average_score"],
                letter_grade=summary.get("letter_grade"),
                overall_percentage=summary["overall_percentage"]
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )