from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import SupplierRepository
from ....domain.entities.hrm_entity import Supplier
from .command import CreateSupplierCommand

class CreateSupplierHandler(RequestHandlerBase[CreateSupplierCommand, Result[Supplier]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateSupplierCommand) -> Result[Supplier]:
        try:
            with self._unit_of_work as uow:
                repo = SupplierRepository(uow.session)
                
                supplier = Supplier(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    address=command.address,
                    city=command.city,
                    code=command.code,
                    contactPerson=command.contactPerson,
                    country=command.country,
                    createdBy=uuid.UUID(command.createdBy),
                    creditLimit=command.creditLimit,
                    email=command.email.lower() if command.email else None,
                    isActive=command.isActive,
                    name=command.name,
                    paymentTerms=command.paymentTerms,
                    phone=command.phone,
                    postalCode=command.postalCode,
                    state=command.state,
                    website=command.website,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(supplier)
                uow.commit()
                return Result.success(supplier)
                
        except Exception as e:
            return Result.failure(f"Failed to create supplier: {str(e)}")
