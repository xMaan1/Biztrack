from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import SupplierRepository
from ....domain.entities.hrm_entity import Supplier
from .command import UpdateSupplierCommand

class UpdateSupplierHandler(RequestHandlerBase[UpdateSupplierCommand, Result[Supplier]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateSupplierCommand) -> Result[Supplier]:
        try:
            with self._unit_of_work as uow:
                repo = SupplierRepository(uow.session)
                
                supplier = repo.get_by_id(command.supplier_id, command.tenant_id)
                if not supplier:
                    return Result.failure("Supplier not found")
                
                                if command.address is not None:
                    supplier.address = command.address
                if command.city is not None:
                    supplier.city = command.city
                if command.code is not None:
                    supplier.code = command.code
                if command.contactPerson is not None:
                    supplier.contactPerson = command.contactPerson
                if command.country is not None:
                    supplier.country = command.country
                if command.createdBy is not None:
                    supplier.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.creditLimit is not None:
                    supplier.creditLimit = command.creditLimit
                if command.email is not None:
                    supplier.email = command.email.lower() if command.email else None
                if command.isActive is not None:
                    supplier.isActive = command.isActive
                if command.name is not None:
                    supplier.name = command.name
                if command.paymentTerms is not None:
                    supplier.paymentTerms = command.paymentTerms
                if command.phone is not None:
                    supplier.phone = command.phone
                if command.postalCode is not None:
                    supplier.postalCode = command.postalCode
                if command.state is not None:
                    supplier.state = command.state
                if command.website is not None:
                    supplier.website = command.website
                
                supplier.updatedAt = datetime.utcnow()
                repo.update(supplier)
                uow.commit()
                
                return Result.success(supplier)
                
        except Exception as e:
            return Result.failure(f"Failed to update supplier: {str(e)}")
