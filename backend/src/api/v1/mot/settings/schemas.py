from decimal import Decimal

from pydantic import BaseModel, Field


class MotSettingsResponse(BaseModel):
    inspection_price: Decimal = Field(..., ge=0)


class MotSettingsUpdate(BaseModel):
    inspection_price: Decimal = Field(..., ge=0)
