"""
Teacher Application Service
Handles teacher application CRUD, review, approval, and rejection
"""
import os
import math
from typing import Optional, Tuple, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models import User, TeacherApplication, ApplicationDocument, ApplicationStatusLog
from ..models.profile import UserProfile
from ..models.teacher import Teacher
from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..core.security import get_password_hash
from .notification_service import NotificationService


class TeacherApplicationService:

    @staticmethod
    def create_application(db: Session, user_id: int, data: dict) -> TeacherApplication:
        """Create a new teacher application"""
        # Check if user already has a pending application
        existing = db.query(TeacherApplication).filter(
            TeacherApplication.user_id == user_id,
            TeacherApplication.status.in_(['submitted', 'reviewed'])
        ).first()
        if existing:
            raise ConflictError("You already have a pending teacher application")

        # Get user for email
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        application = TeacherApplication(
            user_id=user_id,
            status='submitted',
            full_name=data.get('full_name', ''),
            email=data.get('email', user.email),
            phone=data.get('phone'),
            cnic=data.get('cnic'),
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country', 'Pakistan'),
            highest_qualification=data.get('highest_qualification'),
            university=data.get('university'),
            degree=data.get('degree'),
            specialization=data.get('specialization'),
            teaching_experience=data.get('teaching_experience'),
            current_job=data.get('current_job'),
            skills=data.get('skills'),
            languages=data.get('languages'),
            linkedin=data.get('linkedin'),
            portfolio_website=data.get('portfolio_website'),
            subjects=data.get('subjects'),
            categories=data.get('categories'),
            online_teaching_experience=data.get('online_teaching_experience'),
            offline_teaching_experience=data.get('offline_teaching_experience'),
            expected_salary=data.get('expected_salary'),
            available_days=data.get('available_days'),
            available_time=data.get('available_time'),
            teaching_statement=data.get('teaching_statement'),
        )
        db.add(application)
        db.flush()

        # Log initial status
        log = ApplicationStatusLog(
            application_type='teacher',
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
                title="New Teacher Application",
                message=f"A new teacher application has been submitted by {data.get('full_name', user.email)}.",
                type="info",
                link=f"/admin/applications/teachers/{application.id}"
            )

        # Notify applicant
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Application Submitted",
            message="Your teacher application has been submitted successfully. Please wait for admin review.",
            type="success",
            link="/public-user/applications"
        )

        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def get_application(db: Session, application_id: int) -> TeacherApplication:
        """Get a teacher application by ID"""
        application = db.query(TeacherApplication).filter(TeacherApplication.id == application_id).first()
        if not application:
            raise NotFoundError("Application not found", resource_type="TeacherApplication", resource_id=application_id)
        return application

    @staticmethod
    def get_user_application(db: Session, user_id: int) -> Optional[TeacherApplication]:
        """Get the most recent teacher application for a user"""
        return db.query(TeacherApplication).filter(
            TeacherApplication.user_id == user_id
        ).order_by(desc(TeacherApplication.created_at)).first()

    @staticmethod
    def list_applications(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[TeacherApplication], int]:
        """List all teacher applications with optional filters"""
        query = db.query(TeacherApplication)
        if status:
            query = query.filter(TeacherApplication.status == status)
        if search:
            query = query.filter(
                (TeacherApplication.full_name.ilike(f"%{search}%")) |
                (TeacherApplication.email.ilike(f"%{search}%"))
            )
        total = query.count()
        applications = query.order_by(desc(TeacherApplication.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        return applications, total

    @staticmethod
    def review_application(db: Session, application_id: int, admin_id: int, remarks: Optional[str] = None) -> TeacherApplication:
        """Mark application as reviewed"""
        app = TeacherApplicationService.get_application(db, application_id)
        if app.status != 'submitted':
            raise ValidationError(f"Cannot review application with status '{app.status}'")

        old_status = app.status
        app.status = 'reviewed'
        app.reviewed_by = admin_id
        app.reviewed_at = datetime.now()
        if remarks:
            app.admin_remarks = remarks

        log = ApplicationStatusLog(
            application_type='teacher',
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
            message="Your teacher application has been reviewed and is currently under evaluation.",
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
        department_id: Optional[int] = None,
        designation: Optional[str] = None,
        joining_date: Optional[str] = None,
        admin_remarks: Optional[str] = None
    ) -> TeacherApplication:
        """Approve application and convert user to teacher"""
        app = TeacherApplicationService.get_application(db, application_id)
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
            user.role = 'teacher'
            if department_id:
                user.department_id = department_id

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

            # Update teacher record (auto-created by trigger)
            db.flush()
            teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
            if teacher:
                if designation:
                    teacher.employment_type = designation
                if joining_date:
                    teacher.hire_date = joining_date
                if app.specialization:
                    teacher.specialization = app.specialization

        log = ApplicationStatusLog(
            application_type='teacher',
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
            message="Congratulations! Your teacher application has been approved. You now have teacher access.",
            type="success",
            link="/teacher"
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
    ) -> TeacherApplication:
        """Reject application"""
        app = TeacherApplicationService.get_application(db, application_id)
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
            application_type='teacher',
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
            message=f"Unfortunately, your teacher application has been rejected. Reason: {rejection_reason}",
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
            application_type='teacher',
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
            ApplicationDocument.application_type == 'teacher',
            ApplicationDocument.application_id == application_id
        ).all()

    @staticmethod
    def get_status_logs(db: Session, application_id: int) -> List[ApplicationStatusLog]:
        """Get status history for an application"""
        return db.query(ApplicationStatusLog).filter(
            ApplicationStatusLog.application_type == 'teacher',
            ApplicationStatusLog.application_id == application_id
        ).order_by(ApplicationStatusLog.created_at).all()

    @staticmethod
    def get_dashboard_stats(db: Session) -> dict:
        """Get application dashboard statistics for admin"""
        total = db.query(TeacherApplication).count()
        submitted = db.query(TeacherApplication).filter(TeacherApplication.status == 'submitted').count()
        reviewed = db.query(TeacherApplication).filter(TeacherApplication.status == 'reviewed').count()
        selected = db.query(TeacherApplication).filter(TeacherApplication.status == 'selected').count()
        rejected = db.query(TeacherApplication).filter(TeacherApplication.status == 'rejected').count()
        return {
            "total": total,
            "submitted": submitted,
            "reviewed": reviewed,
            "selected": selected,
            "rejected": rejected,
        }
