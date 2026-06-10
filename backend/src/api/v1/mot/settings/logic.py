from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.mot.mot_settings import DEFAULT_MOT_INSPECTION_PRICE, MotSettings
from .schemas import MotSettingsResponse, MotSettingsUpdate


def _settings_row(db: Session) -> MotSettings:
    row = db.query(MotSettings).filter(MotSettings.id == 1).first()
    if row:
        return row
    row = MotSettings(id=1, inspection_price=DEFAULT_MOT_INSPECTION_PRICE)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_mot_settings(db: Session) -> MotSettingsResponse:
    row = _settings_row(db)
    return MotSettingsResponse(inspection_price=Decimal(str(row.inspection_price)))


def update_mot_settings(db: Session, body: MotSettingsUpdate) -> MotSettingsResponse:
    price = Decimal(str(body.inspection_price))
    if price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="inspection_price must be zero or greater",
        )
    row = _settings_row(db)
    row.inspection_price = price
    db.commit()
    db.refresh(row)
    return MotSettingsResponse(inspection_price=Decimal(str(row.inspection_price)))
