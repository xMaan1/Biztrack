from typing import Type, TypeVar

from pydantic import BaseModel

from .donors.schemas import Donor
from .partner_organizations.schemas import PartnerOrganization

T = TypeVar("T", bound=BaseModel)


def orm_to_schema(schema_cls: Type[T], orm, **extra) -> T:
    inst = schema_cls.model_validate(orm, from_attributes=True)
    updates = {}
    if hasattr(orm, "id"):
        updates["id"] = str(orm.id)
    if hasattr(orm, "tenant_id"):
        updates["tenant_id"] = str(orm.tenant_id)
    if hasattr(orm, "total_donated") and orm.total_donated is not None:
        updates["total_donated"] = float(orm.total_donated)
    updates.update(extra)
    if updates:
        return inst.model_copy(update=updates)
    return inst


def donor_to_schema(orm) -> Donor:
    return orm_to_schema(Donor, orm)


def partner_to_schema(orm) -> PartnerOrganization:
    return orm_to_schema(PartnerOrganization, orm)
