from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CustomerRepository
from ....domain.entities.crm_entity import Customer
from .command import UpdateCustomerCommand

class UpdateCustomerHandler(RequestHandlerBase[UpdateCustomerCommand, Result[Customer]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateCustomerCommand) -> Result[Customer]:
        try:
            with self._unit_of_work as uow:
                customer_repo = CustomerRepository(uow.session)
                
                customer = customer_repo.get_by_id(command.customer_id, command.tenant_id)
                if not customer:
                    return Result.failure("Customer not found")
                
                if command.email and command.email.lower() != customer.email:
                    existing_customer = customer_repo.get_by_email(command.email, command.tenant_id)
                    if existing_customer and str(existing_customer.id) != command.customer_id:
                        return Result.failure("Customer with this email already exists")
                    customer.email = command.email.lower()
                
                if command.cnic and command.cnic != customer.cnic:
                    existing_cnic = customer_repo.get_by_cnic(command.cnic, command.tenant_id)
                    if existing_cnic and str(existing_cnic.id) != command.customer_id:
                        return Result.failure("Customer with this CNIC already exists")
                    customer.cnic = command.cnic
                
                if command.firstName is not None:
                    customer.firstName = command.firstName
                if command.lastName is not None:
                    customer.lastName = command.lastName
                if command.phone is not None:
                    customer.phone = command.phone if command.phone else None
                if command.mobile is not None:
                    customer.mobile = command.mobile if command.mobile else None
                if command.dateOfBirth is not None:
                    customer.dateOfBirth = command.dateOfBirth
                if command.gender is not None:
                    customer.gender = command.gender
                if command.address is not None:
                    customer.address = command.address if command.address else None
                if command.city is not None:
                    customer.city = command.city
                if command.state is not None:
                    customer.state = command.state
                if command.country is not None:
                    customer.country = command.country
                if command.postalCode is not None:
                    customer.postalCode = command.postalCode if command.postalCode else None
                if command.customerType is not None:
                    customer.customerType = command.customerType
                if command.customerStatus is not None:
                    customer.customerStatus = command.customerStatus
                if command.creditLimit is not None:
                    customer.creditLimit = command.creditLimit
                if command.currentBalance is not None:
                    customer.currentBalance = command.currentBalance
                if command.paymentTerms is not None:
                    customer.paymentTerms = command.paymentTerms
                if command.assignedToId is not None:
                    import uuid
                    customer.assignedToId = uuid.UUID(command.assignedToId) if command.assignedToId else None
                if command.notes is not None:
                    customer.notes = command.notes
                if command.tags is not None:
                    customer.tags = command.tags
                
                customer.updatedAt = datetime.utcnow()
                customer_repo.update(customer)
                uow.commit()
                
                return Result.success(customer)
                
        except Exception as e:
            return Result.failure(f"Failed to update customer: {str(e)}")

