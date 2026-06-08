from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.workshop import MotRetailer
from ...repository import get_by_id, create_entity, delete_by_id
from .schemas import MotRetailerCreate, MotRetailerUpdate, MotRetailersResponse, MotRetailer as MotRetailerSchema


def _to_schema(row: MotRetailer) -> MotRetailerSchema:
    return MotRetailerSchema(
        id=str(row.id),
        tenant_id=str(row.tenant_id),
        name=row.name,
        address_line1=row.address_line1,
        address_line2=row.address_line2,
        city=row.city,
        county=row.county,
        postcode=row.postcode,
        phone=row.phone,
        email=row.email,
        is_default=bool(row.is_default),
        is_active=bool(row.is_active),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _clear_default_retailers(db: Session, tenant_id: str, exclude_id: Optional[str] = None):
    query = db.query(MotRetailer).filter(
        MotRetailer.tenant_id == tenant_id,
        MotRetailer.is_default == True,
    )
    if exclude_id:
        query = query.filter(MotRetailer.id != exclude_id)
    for row in query.all():
        row.is_default = False
    db.commit()


def list_mot_retailers(tenant_id: str, db: Session) -> MotRetailersResponse:
    rows = (
        db.query(MotRetailer)
        .filter(MotRetailer.tenant_id == tenant_id, MotRetailer.is_active == True)
        .order_by(MotRetailer.is_default.desc(), MotRetailer.name.asc())
        .all()
    )
    retailers = [_to_schema(r) for r in rows]
    return MotRetailersResponse(retailers=retailers, total=len(retailers))


def get_mot_retailer(tenant_id: str, retailer_id: str, db: Session) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    return _to_schema(row)


def create_mot_retailer(tenant_id: str, body: MotRetailerCreate, db: Session) -> MotRetailerSchema:
    if body.is_default:
        _clear_default_retailers(db, tenant_id)
    data = body.model_dump()
    data["tenant_id"] = tenant_id
    data["is_active"] = True
    row = create_entity(MotRetailer, data, db)
    return _to_schema(row)


def update_mot_retailer(
    tenant_id: str, retailer_id: str, body: MotRetailerUpdate, db: Session
) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    update_data = body.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        _clear_default_retailers(db, tenant_id, exclude_id=retailer_id)
    for key, value in update_data.items():
        if hasattr(row, key):
            setattr(row, key, value)
    from datetime import datetime as dt
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return _to_schema(row)


def set_default_mot_retailer(tenant_id: str, retailer_id: str, db: Session) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    _clear_default_retailers(db, tenant_id, exclude_id=retailer_id)
    row.is_default = True
    from datetime import datetime as dt
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return _to_schema(row)


def delete_mot_retailer(tenant_id: str, retailer_id: str, db: Session) -> None:
    deleted = delete_by_id(MotRetailer, retailer_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
