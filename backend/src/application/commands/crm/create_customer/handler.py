from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CustomerRepository
from ....domain.entities.crm_entity import Customer
from .command import CreateCustomerCommand

class CreateCustomerHandler(RequestHandlerBase[CreateCustomerCommand, Result[Customer]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateCustomerCommand) -> Result[Customer]:
        try:
            with self._unit_of_work as uow:
                customer_repo = CustomerRepository(uow.session)
                
                existing_customer = customer_repo.get_by_email(command.email, command.tenant_id)
                if existing_customer:
                    return Result.failure("Customer with this email already exists")
                
                if command.cnic:
                    existing_cnic = customer_repo.get_by_cnic(command.cnic, command.tenant_id)
                    if existing_cnic:
                        return Result.failure("Customer with this CNIC already exists")
                
                customer_entity = Customer(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    firstName=command.firstName,
                    lastName=command.lastName,
                    email=command.email.lower(),
                    phone=command.phone,
                    mobile=command.mobile,
                    cnic=command.cnic,
                    dateOfBirth=command.dateOfBirth,
                    gender=command.gender,
                    address=command.address,
                    city=command.city,
                    state=command.state,
                    country=command.country,
                    postalCode=command.postalCode,
                    customerType=command.customerType,
                    customerStatus=command.customerStatus,
                    creditLimit=command.creditLimit,
                    currentBalance=command.currentBalance,
                    paymentTerms=command.paymentTerms,
                    assignedToId=uuid.UUID(command.assignedToId) if command.assignedToId else None,
                    notes=command.notes,
                    tags=command.tags or [],
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                customer_repo.add(customer_entity)
                uow.commit()
                return Result.success(customer_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create customer: {str(e)}")

