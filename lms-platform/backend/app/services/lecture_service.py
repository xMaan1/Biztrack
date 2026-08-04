"""
Lecture Service
Handles lecture management, video uploads, and progress tracking
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..models import Lecture, Course, LectureMaterial, LectureProgress
from ..schemas.lecture import LectureCreate, LectureUpdate


class LectureService:
    """Lecture management service"""

    @staticmethod
    def get_lecture_by_id(
        db: Session,
        lecture_id: int,
        include_deleted: bool = False
    ) -> Optional[Lecture]:
        """Get lecture by ID"""
        query = db.query(Lecture).filter(Lecture.id == lecture_id)
        if not include_deleted:
            query = query.filter(Lecture.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_course_lectures(
        db: Session,
        course_id: int,
        skip: int = 0,
        limit: int = 20,
        is_published: Optional[bool] = None
    ) -> tuple[List[Lecture], int]:
        """
        Get lectures for a course
        """
        query = db.query(Lecture).filter(
            Lecture.course_id == course_id,
            Lecture.deleted_at.is_(None)
        )

        if is_published is not None:
            query = query.filter(Lecture.is_published == is_published)

        total = query.count()
        lectures = query.order_by(Lecture.order_index).offset(skip).limit(limit).all()

        return lectures, total

    @staticmethod
    def create_lecture(
        db: Session,
        lecture_data: LectureCreate,
        course_id: int
    ) -> Lecture:
        """
        Create a new lecture
        """
        # Check if course exists
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.deleted_at.is_(None)
        ).first()
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        # Check if lecture number already exists for this course
        existing = db.query(Lecture).filter(
            Lecture.course_id == course_id,
            Lecture.lecture_number == lecture_data.lecture_number,
            Lecture.deleted_at.is_(None)
        ).first()

        if existing:
            raise ConflictError(f"Lecture number {lecture_data.lecture_number} already exists for this course")

        # Create lecture
        create_data = lecture_data.model_dump() if hasattr(lecture_data, 'model_dump') else lecture_data.dict()
        create_data['course_id'] = course_id
        lecture = Lecture(**create_data)
        db.add(lecture)
        db.commit()
        db.refresh(lecture)

        return lecture

    @staticmethod
    def update_lecture(
        db: Session,
        lecture_id: int,
        lecture_data: LectureUpdate
    ) -> Lecture:
        """
        Update an existing lecture
        """
        lecture = LectureService.get_lecture_by_id(db, lecture_id)
        if not lecture:
            raise NotFoundError("Lecture not found", resource_type="Lecture", resource_id=lecture_id)

        # Check if lecture number is being changed and is unique
        if lecture_data.lecture_number and lecture_data.lecture_number != lecture.lecture_number:
            existing = db.query(Lecture).filter(
                Lecture.course_id == lecture.course_id,
                Lecture.lecture_number == lecture_data.lecture_number,
                Lecture.deleted_at.is_(None),
                Lecture.id != lecture_id
            ).first()
            if existing:
                raise ConflictError(f"Lecture number {lecture_data.lecture_number} already exists for this course")

        # Update fields
        update_dict = lecture_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(lecture, field, value)

        db.commit()
        db.refresh(lecture)

        return lecture

    @staticmethod
    def publish_lecture(db: Session, lecture_id: int) -> Lecture:
        lecture = LectureService.get_lecture_by_id(db, lecture_id)
        if not lecture:
            raise NotFoundError("Lecture not found", resource_type="Lecture", resource_id=lecture_id)
        lecture.is_published = True
        db.commit()
        db.refresh(lecture)
        return lecture

    @staticmethod
    def unpublish_lecture(db: Session, lecture_id: int) -> Lecture:
        lecture = LectureService.get_lecture_by_id(db, lecture_id)
        if not lecture:
            raise NotFoundError("Lecture not found", resource_type="Lecture", resource_id=lecture_id)
        lecture.is_published = False
        db.commit()
        db.refresh(lecture)
        return lecture

    @staticmethod
    def delete_lecture(
        db: Session,
        lecture_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete a lecture
        """
        lecture = LectureService.get_lecture_by_id(db, lecture_id)
        if not lecture:
            raise NotFoundError("Lecture not found", resource_type="Lecture", resource_id=lecture_id)

        if soft_delete:
            lecture.deleted_at = datetime.now()
            lecture.is_published = False
        else:
            db.delete(lecture)

        db.commit()
        return True

    @staticmethod
    def track_progress(
        db: Session,
        student_id: int,
        lecture_id: int,
        progress_percentage: float,
        watch_time_seconds: int
    ) -> Dict[str, Any]:
        """
        Track student progress for a lecture
        """
        # Check if lecture exists
        lecture = LectureService.get_lecture_by_id(db, lecture_id)
        if not lecture:
            raise NotFoundError("Lecture not found", resource_type="Lecture", resource_id=lecture_id)

        # Check if progress record exists
        progress = db.query(LectureProgress).filter(
            LectureProgress.student_id == student_id,
            LectureProgress.lecture_id == lecture_id
        ).first()

        is_completed = progress_percentage >= 100

        if progress:
            # Update existing progress
            progress.progress_percentage = max(progress.progress_percentage, progress_percentage)
            progress.watch_time_seconds += watch_time_seconds
            progress.last_watched_at = datetime.now()
            
            if is_completed and not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = datetime.now()
        else:
            # Create new progress record
            progress = LectureProgress(
                student_id=student_id,
                lecture_id=lecture_id,
                progress_percentage=progress_percentage,
                watch_time_seconds=watch_time_seconds,
                last_watched_at=datetime.now(),
                is_completed=is_completed,
                completed_at=datetime.now() if is_completed else None
            )
            db.add(progress)

        db.commit()
        db.refresh(progress)

        return {
            "lecture_id": lecture_id,
            "progress_percentage": progress.progress_percentage,
            "is_completed": progress.is_completed,
            "watch_time_seconds": progress.watch_time_seconds,
        }

    @staticmethod
    def get_student_progress(
        db: Session,
        student_id: int,
        course_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get progress for a student across all lectures or for a specific course
        """
        query = db.query(LectureProgress).filter(
            LectureProgress.student_id == student_id
        )

        if course_id:
            query = query.join(Lecture).filter(
                Lecture.course_id == course_id,
                Lecture.deleted_at.is_(None)
            )

        progress_records = query.all()

        result = []
        for progress in progress_records:
            result.append({
                "lecture_id": progress.lecture_id,
                "lecture_title": progress.lecture.title if progress.lecture else None,
                "course_id": progress.lecture.course_id if progress.lecture else None,
                "progress_percentage": progress.progress_percentage,
                "is_completed": progress.is_completed,
                "watch_time_seconds": progress.watch_time_seconds,
                "last_watched_at": progress.last_watched_at,
                "completed_at": progress.completed_at,
            })

        return result

    @staticmethod
    def get_course_progress_summary(
        db: Session,
        course_id: int,
        student_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get progress summary for a course
        """
        # Get total lectures
        total_lectures = db.query(Lecture).filter(
            Lecture.course_id == course_id,
            Lecture.is_published == True,
            Lecture.deleted_at.is_(None)
        ).count()

        if total_lectures == 0:
            return {
                "course_id": course_id,
                "total_lectures": 0,
                "completed_lectures": 0,
                "progress_percentage": 0,
            }

        if student_id:
            # Get progress for specific student
            completed = db.query(LectureProgress).filter(
                LectureProgress.student_id == student_id,
                LectureProgress.is_completed == True,
                LectureProgress.lecture.has(course_id=course_id)
            ).count()

            return {
                "course_id": course_id,
                "total_lectures": total_lectures,
                "completed_lectures": completed,
                "progress_percentage": round((completed / total_lectures) * 100, 2),
            }
        else:
            # Get average progress across all students
            # This would require more complex query
            return {
                "course_id": course_id,
                "total_lectures": total_lectures,
                "message": "Student ID required for detailed progress",
            }