"""
Student Application Service
Handles student application CRUD, review, approval, and rejection
"""
import os
import math
from typing import Optional, Tuple, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models import User, StudentApplication, ApplicationDocument, ApplicationStatusLog
from ..models.profile import UserProfile
from ..models.student import Student
from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..core.security import get_password_hash
from .notification_service import NotificationService


class StudentApplicationService:

    @staticmethod
    def create_application(db: Session, user_id: int, data: dict) -> StudentApplication:
        """Create a new student application"""
        # Check if user already has a pending application
        existing = db.query(StudentApplication).filter(
            StudentApplication.user_id == user_id,
            StudentApplication.status.in_(['submitted', 'reviewed'])
        ).first()
        if existing:
            raise ConflictError("You already have a pending student application")

        # Get user for email
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        application = StudentApplication(
            user_id=user_id,
            status='submitted',
            full_name=data.get('full_name', ''),
            email=data.get('email', user.email),
            phone=data.get('phone'),
            cnic_passport=data.get('cnic_passport'),
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country', 'Pakistan'),
            current_qualification=data.get('current_qualification'),
            school_college_university=data.get('school_college_university'),
            previous_qualification=data.get('previous_qualification'),
            field_of_study=data.get('field_of_study'),
            gpa_percentage=data.get('gpa_percentage'),
            interested_courses=data.get('interested_courses'),
            learning_category=data.get('learning_category'),
            previous_experience=data.get('previous_experience'),
            career_goals=data.get('career_goals'),
            learning_mode=data.get('learning_mode'),
            availability=data.get('availability'),
        )
        db.add(application)
        db.flush()

        # Log initial status
        log = ApplicationStatusLog(
            application_type='student',
            application_id=application.id,
            old_status=None,
            new_status='submitted',
            remarks='Application submitted'
        )
        db.add(log)

        # Notify all admins
        admins = db.query(User).filter(User.role == 'admin', User.deleted_at.is_(None)).all()
        for admin in admins:
            NotificationService.create_notification(
                db,
                user_id=admin.id,
                title="New Student Application",
                message=f"A new student application has been submitted by {data.get('full_name', user.email)}.",
                type="info",
                link=f"/admin/applications/students/{application.id}"
            )

        # Notify applicant
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Application Submitted",
            message="Your student application has been submitted successfully. Please wait for admin review.",
            type="success",
            link="/public-user/applications"
        )

        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def get_application(db: Session, application_id: int) -> StudentApplication:
        """Get a student application by ID"""
        application = db.query(StudentApplication).filter(StudentApplication.id == application_id).first()
        if not application:
            raise NotFoundError("Application not found", resource_type="StudentApplication", resource_id=application_id)
        return application

    @staticmethod
    def get_user_application(db: Session, user_id: int) -> Optional[StudentApplication]:
        """Get the most recent student application for a user"""
        return db.query(StudentApplication).filter(
            StudentApplication.user_id == user_id
        ).order_by(desc(StudentApplication.created_at)).first()

    @staticmethod
    def list_applications(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[StudentApplication], int]:
        """List all student applications with optional filters"""
        query = db.query(StudentApplication)
        if status:
            query = query.filter(StudentApplication.status == status)
        if search:
            query = query.filter(
                (StudentApplication.full_name.ilike(f"%{search}%")) |
                (StudentApplication.email.ilike(f"%{search}%"))
            )
        total = query.count()
        applications = query.order_by(desc(StudentApplication.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        return applications, total

    @staticmethod
    def review_application(db: Session, application_id: int, admin_id: int, remarks: Optional[str] = None) -> StudentApplication:
        """Mark application as reviewed"""
        app = StudentApplicationService.get_application(db, application_id)
        if app.status != 'submitted':
            raise ValidationError(f"Cannot review application with status '{app.status}'")

        old_status = app.status
        app.status = 'reviewed'
        app.reviewed_by = admin_id
        app.reviewed_at = datetime.now()
        if remarks:
            app.admin_remarks = remarks

        log = ApplicationStatusLog(
            application_type='student',
            application_id=app.id,
            old_status=old_status,
            new_status='reviewed',
            changed_by=admin_id,
            remarks=remarks
        )
        db.add(log)

        NotificationService.create_notification(
            db,
            user_id=app.user_id,
            title="Application Reviewed",
            message="Your student application has been reviewed and is currently under evaluation.",
            type="info",
            link="/public-user/applications"
        )

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def approve_application(
        db: Session,
        application_id: int,
        admin_id: int,
        student_number: Optional[str] = None,
        admin_remarks: Optional[str] = None
    ) -> StudentApplication:
        """Approve application and convert user to student"""
        app = StudentApplicationService.get_application(db, application_id)
        if app.status not in ('submitted', 'reviewed'):
            raise ValidationError(f"Cannot approve application with status '{app.status}'")

        old_status = app.status
        app.status = 'selected'
        app.reviewed_by = admin_id
        app.reviewed_at = datetime.now()
        if admin_remarks:
            app.admin_remarks = admin_remarks

        # Convert user role
        user = db.query(User).filter(User.id == app.user_id).first()
        if user:
            user.role = 'student'

            # Update or create profile
            if user.profile:
                user.profile.first_name = app.full_name.split()[0] if app.full_name else user.profile.first_name
                user.profile.last_name = ' '.join(app.full_name.split()[1:]) if len(app.full_name.split()) > 1 else user.profile.last_name
                if app.phone:
                    user.profile.phone = app.phone
                if app.gender:
                    user.profile.gender = app.gender
                if app.address:
                    user.profile.address = app.address
                if app.city:
                    user.profile.city = app.city
                if app.country:
                    user.profile.country = app.country
            else:
                profile = UserProfile(
                    user_id=user.id,
                    first_name=app.full_name.split()[0] if app.full_name else '',
                    last_name=' '.join(app.full_name.split()[1:]) if len(app.full_name.split()) > 1 else '',
                    phone=app.phone,
                    gender=app.gender,
                    address=app.address,
                    city=app.city,
                    country=app.country,
                )
                db.add(profile)

            # Update student record (auto-created by trigger)
            db.flush()
            student = db.query(Student).filter(Student.user_id == user.id).first()
            if student:
                if student_number:
                    student.student_number = student_number
                student.enrollment_year = datetime.now().year

        log = ApplicationStatusLog(
            application_type='student',
            application_id=app.id,
            old_status=old_status,
            new_status='selected',
            changed_by=admin_id,
            remarks=admin_remarks
        )
        db.add(log)

        NotificationService.create_notification(
            db,
            user_id=app.user_id,
            title="Application Approved!",
            message="Congratulations! Your student application has been approved. You now have student access.",
            type="success",
            link="/student"
        )

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def reject_application(
        db: Session,
        application_id: int,
        admin_id: int,
        rejection_reason: str,
        admin_remarks: Optional[str] = None
    ) -> StudentApplication:
        """Reject application"""
        app = StudentApplicationService.get_application(db, application_id)
        if app.status in ('selected', 'rejected'):
            raise ValidationError(f"Cannot reject application with status '{app.status}'")

        old_status = app.status
        app.status = 'rejected'
        app.rejection_reason = rejection_reason
        app.reviewed_by = admin_id
        app.reviewed_at = datetime.now()
        if admin_remarks:
            app.admin_remarks = admin_remarks

        log = ApplicationStatusLog(
            application_type='student',
            application_id=app.id,
            old_status=old_status,
            new_status='rejected',
            changed_by=admin_id,
            remarks=rejection_reason
        )
        db.add(log)

        NotificationService.create_notification(
            db,
            user_id=app.user_id,
            title="Application Rejected",
            message=f"Unfortunately, your student application has been rejected. Reason: {rejection_reason}",
            type="error",
            link="/public-user/applications"
        )

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def upload_document(
        db: Session,
        application_id: int,
        document_type: str,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: Optional[str] = None
    ) -> ApplicationDocument:
        """Upload a document for an application"""
        doc = ApplicationDocument(
            application_type='student',
            application_id=application_id,
            document_type=document_type,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_documents(db: Session, application_id: int) -> List[ApplicationDocument]:
        """Get all documents for an application"""
        return db.query(ApplicationDocument).filter(
            ApplicationDocument.application_type == 'student',
            ApplicationDocument.application_id == application_id
        ).all()

    @staticmethod
    def get_status_logs(db: Session, application_id: int) -> List[ApplicationStatusLog]:
        """Get status history for an application"""
        return db.query(ApplicationStatusLog).filter(
            ApplicationStatusLog.application_type == 'student',
            ApplicationStatusLog.application_id == application_id
        ).order_by(ApplicationStatusLog.created_at).all()

    @staticmethod
    def get_dashboard_stats(db: Session) -> dict:
        """Get application dashboard statistics for admin"""
        total = db.query(StudentApplication).count()
        submitted = db.query(StudentApplication).filter(StudentApplication.status == 'submitted').count()
        reviewed = db.query(StudentApplication).filter(StudentApplication.status == 'reviewed').count()
        selected = db.query(StudentApplication).filter(StudentApplication.status == 'selected').count()
        rejected = db.query(StudentApplication).filter(StudentApplication.status == 'rejected').count()
        return {
            "total": total,
            "submitted": submitted,
            "reviewed": reviewed,
            "selected": selected,
            "rejected": rejected,
        }
