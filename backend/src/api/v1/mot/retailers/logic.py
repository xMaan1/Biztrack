from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.mot import MotRetailer
from ...repository import get_by_id, create_entity, delete_by_id
from .schemas import MotRetailerCreate, MotRetailerUpdate, MotRetailersResponse, MotRetailer as MotRetailerSchema


def _to_schema(row: MotRetailer) -> MotRetailerSchema:
    return MotRetailerSchema(
        id=str(row.id),
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


def _clear_default_retailers(db: Session, exclude_id: Optional[str] = None):
    query = db.query(MotRetailer).filter(MotRetailer.is_default == True)
    if exclude_id:
        query = query.filter(MotRetailer.id != exclude_id)
    for row in query.all():
        row.is_default = False
    db.commit()


def list_mot_retailers(db: Session) -> MotRetailersResponse:
    rows = (
        db.query(MotRetailer)
        .filter(MotRetailer.is_active == True)
        .order_by(MotRetailer.is_default.desc(), MotRetailer.name.asc())
        .all()
    )
    retailers = [_to_schema(r) for r in rows]
    return MotRetailersResponse(retailers=retailers, total=len(retailers))


def get_mot_retailer(retailer_id: str, db: Session) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    return _to_schema(row)


def create_mot_retailer(body: MotRetailerCreate, db: Session) -> MotRetailerSchema:
    if body.is_default:
        _clear_default_retailers(db)
    data = body.model_dump()
    data["is_active"] = True
    row = create_entity(MotRetailer, data, db)
    return _to_schema(row)


def update_mot_retailer(retailer_id: str, body: MotRetailerUpdate, db: Session) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    update_data = body.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        _clear_default_retailers(db, exclude_id=retailer_id)
    for key, value in update_data.items():
        if hasattr(row, key):
            setattr(row, key, value)
    from datetime import datetime as dt
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return _to_schema(row)


def set_default_mot_retailer(retailer_id: str, db: Session) -> MotRetailerSchema:
    row = get_by_id(MotRetailer, retailer_id, db)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    _clear_default_retailers(db, exclude_id=retailer_id)
    row.is_default = True
    from datetime import datetime as dt
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return _to_schema(row)


def delete_mot_retailer(retailer_id: str, db: Session) -> None:
    deleted = delete_by_id(MotRetailer, retailer_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
