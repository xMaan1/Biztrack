"""
Report Router
Handles report generation and analytics
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_admin, require_teacher_or_student
from ....schemas.common import ResponseWrapper
from ....services.report_service import ReportService

router = APIRouter()


@router.get("/enrollment-stats", response_model=ResponseWrapper)
async def get_enrollment_statistics(
    course_id: Optional[int] = Query(None, description="Course ID"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get enrollment statistics (Teacher/Admin only)
    """
    try:
        stats = ReportService.get_enrollment_statistics(db, course_id)
        
        return ResponseWrapper(
            success=True,
            message="Enrollment statistics retrieved successfully",
            data=stats
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/attendance-stats", response_model=ResponseWrapper)
async def get_attendance_statistics(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get attendance statistics for a course (Teacher/Admin only)
    """
    try:
        stats = ReportService.get_attendance_statistics(db, course_id)
        
        return ResponseWrapper(
            success=True,
            message="Attendance statistics retrieved successfully",
            data=stats
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/grade-distribution", response_model=ResponseWrapper)
async def get_grade_distribution(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get grade distribution for a course (Teacher/Admin only)
    """
    try:
        distribution = ReportService.get_grade_distribution(db, course_id)
        
        return ResponseWrapper(
            success=True,
            message="Grade distribution retrieved successfully",
            data=distribution
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/course-performance", response_model=ResponseWrapper)
async def get_course_performance(
    course_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get course performance analytics (Teacher/Admin only)
    """
    try:
        performance = ReportService.get_course_performance(db, course_id)
        
        return ResponseWrapper(
            success=True,
            message="Course performance retrieved successfully",
            data=performance
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/system-stats", response_model=ResponseWrapper)
async def get_system_statistics(
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Get system-wide statistics (Admin only)
    """
    try:
        stats = ReportService.get_system_statistics(db)
        
        return ResponseWrapper(
            success=True,
            message="System statistics retrieved successfully",
            data=stats
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )