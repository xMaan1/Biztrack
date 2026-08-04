import random
import string
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.live_session import LiveSession
from ..core.exceptions import NotFoundError, PermissionError


class LiveSessionService:

    @staticmethod
    def _generate_code(length=6) -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

    @staticmethod
    def create_session(db: Session, teacher_id: int, data) -> LiveSession:
        code = LiveSessionService._generate_code()
        while db.query(LiveSession).filter(LiveSession.session_code == code).first():
            code = LiveSessionService._generate_code()
        session = LiveSession(
            course_id=data.course_id,
            lecture_id=data.lecture_id,
            teacher_id=teacher_id,
            title=data.title,
            description=data.description,
            session_code=code,
            participant_ids=data.participant_ids or [],
            invite_teachers=data.invite_teachers or [],
            invite_admins=data.invite_admins or [],
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session_by_id(db: Session, session_id: int) -> Optional[LiveSession]:
        return db.query(LiveSession).filter(LiveSession.id == session_id).first()

    @staticmethod
    def get_session_by_code(db: Session, code: str) -> Optional[LiveSession]:
        return db.query(LiveSession).filter(LiveSession.session_code == code.upper()).first()

    @staticmethod
    def get_teacher_sessions(db: Session, teacher_id: int, skip=0, limit=20) -> tuple:
        query = db.query(LiveSession).filter(LiveSession.teacher_id == teacher_id)
        total = query.count()
        sessions = query.order_by(desc(LiveSession.created_at)).offset(skip).limit(limit).all()
        return sessions, total

    @staticmethod
    def start_session(db: Session, session_id: int, teacher_id: int) -> LiveSession:
        session = LiveSessionService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Session not found", resource_type="LiveSession", resource_id=session_id)
        if session.teacher_id != teacher_id:
            raise PermissionError("Only the teacher can start the session")
        session.status = "active"
        session.started_at = datetime.now()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def end_session(db: Session, session_id: int, teacher_id: int) -> LiveSession:
        session = LiveSessionService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Session not found", resource_type="LiveSession", resource_id=session_id)
        session.status = "ended"
        session.ended_at = datetime.now()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def join_session(db: Session, session_code: str, student_id: int) -> LiveSession:
        session = LiveSessionService.get_session_by_code(db, session_code)
        if not session:
            raise NotFoundError("Session not found", resource_type="LiveSession", resource_id=0)
        if session.status != "active":
            raise PermissionError("Session is not active")
        participants = session.participant_ids or []
        if student_id not in participants:
            participants.append(student_id)
            session.participant_ids = participants
            db.commit()
            db.refresh(session)
        return session

    @staticmethod
    def delete_session(db: Session, session_id: int, teacher_id: int) -> None:
        session = LiveSessionService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Session not found", resource_type="LiveSession", resource_id=session_id)
        if session.teacher_id != teacher_id:
            raise PermissionError("Only the owner can delete this session")
        db.delete(session)
        db.commit()

    @staticmethod
    def get_active_sessions_for_courses(db: Session, course_ids: List[int]) -> List[LiveSession]:
        if not course_ids:
            return []
        return db.query(LiveSession).filter(
            LiveSession.course_id.in_(course_ids),
            LiveSession.status == 'active'
        ).order_by(desc(LiveSession.created_at)).all()

    @staticmethod
    def update_participants(db: Session, session_id: int, teacher_id: int, participant_ids: List[int]) -> LiveSession:
        session = LiveSessionService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Session not found", resource_type="LiveSession", resource_id=session_id)
        session.participant_ids = participant_ids
        db.commit()
        db.refresh(session)
        return session
