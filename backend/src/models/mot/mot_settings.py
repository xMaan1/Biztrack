from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Integer, Numeric

from ...config.database_config import Base

DEFAULT_MOT_INSPECTION_PRICE = Decimal("49.00")


class MotSettings(Base):
    __tablename__ = "mot_settings"

    id = Column(Integer, primary_key=True, default=1)
    inspection_price = Column(Numeric(10, 2), nullable=False, default=DEFAULT_MOT_INSPECTION_PRICE)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
