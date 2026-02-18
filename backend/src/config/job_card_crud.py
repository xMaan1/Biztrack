from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from .job_card_models import JobCard


def get_job_card_by_id(job_card_id: str, db: Session, tenant_id: str = None) -> Optional[JobCard]:
    query = db.query(JobCard).filter(JobCard.id == job_card_id)
    if tenant_id:
        query = query.filter(JobCard.tenant_id == tenant_id)
    return query.first()


def get_all_job_cards(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    work_order_id: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
) -> List[JobCard]:
    query = db.query(JobCard).filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
    if status:
        query = query.filter(JobCard.status == status)
    if work_order_id:
        query = query.filter(JobCard.work_order_id == work_order_id)
    if assigned_to_id:
        query = query.filter(JobCard.assigned_to_id == assigned_to_id)
    return query.order_by(JobCard.created_at.desc()).offset(skip).limit(limit).all()


def get_next_job_card_number(db: Session, tenant_id: str) -> str:
    last_jc = (
        db.query(JobCard)
        .filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
        .order_by(JobCard.job_card_number.desc())
        .first()
    )
    if last_jc:
        try:
            last_number = int(last_jc.job_card_number.split("-")[-1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        next_number = 1
    year = datetime.utcnow().year
    return f"JC-{year}-{next_number:03d}"


def create_job_card(job_card_data: dict, db: Session) -> JobCard:
    db_job_card = JobCard(**job_card_data)
    db.add(db_job_card)
    db.commit()
    db.refresh(db_job_card)
    return db_job_card


def update_job_card(job_card_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[JobCard]:
    job_card = get_job_card_by_id(job_card_id, db, tenant_id)
    if not job_card:
        return None
    for key, value in update_data.items():
        if hasattr(job_card, key):
            setattr(job_card, key, value)
    job_card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job_card)
    return job_card


def delete_job_card(job_card_id: str, db: Session, tenant_id: str = None) -> bool:
    job_card = get_job_card_by_id(job_card_id, db, tenant_id)
    if not job_card:
        return False
    job_card.is_active = False
    job_card.updated_at = datetime.utcnow()
    db.commit()
    return True


def get_job_card_stats(db: Session, tenant_id: str) -> dict:
    from sqlalchemy import case
    counts = (
        db.query(
            func.count(JobCard.id).label("total"),
            func.sum(case((JobCard.status == "draft", 1), else_=0)).label("draft"),
            func.sum(case((JobCard.status == "in_progress", 1), else_=0)).label("in_progress"),
            func.sum(case((JobCard.status == "completed", 1), else_=0)).label("completed"),
            func.sum(case((JobCard.status == "cancelled", 1), else_=0)).label("cancelled"),
        )
        .filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
        .first()
    )
    return {
        "total": counts.total or 0,
        "draft": counts.draft or 0,
        "in_progress": counts.in_progress or 0,
        "completed": counts.completed or 0,
        "cancelled": counts.cancelled or 0,
    }
