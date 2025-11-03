from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceRepository
from ....domain.entities.invoice_entity import Invoice
from .command import CreateInvoiceCommand

class CreateInvoiceHandler(RequestHandlerBase[CreateInvoiceCommand, Result[Invoice]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateInvoiceCommand) -> Result[Invoice]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceRepository(uow.session)
                
                invoice = Invoice(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    balance=command.balance,
                    billingAddress=command.billingAddress,
                    createdBy=uuid.UUID(command.createdBy),
                    currency=command.currency,
                    customerCity=command.customerCity,
                    customerCountry=command.customerCountry,
                    customerEmail=command.customerEmail.lower() if command.customerEmail else None,
                    customerId=command.customerId,
                    customerName=command.customerName,
                    customerPhone=command.customerPhone,
                    customerPostalCode=command.customerPostalCode,
                    customerState=command.customerState,
                    discount=command.discount,
                    discountAmount=command.discountAmount,
                    dueDate=datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else datetime.utcnow(),
                    invoiceNumber=command.invoiceNumber,
                    issueDate=datetime.fromisoformat(command.issueDate.replace('Z', '+00:00')) if command.issueDate else datetime.utcnow(),
                    items=command.items or [],
                    jobDescription=command.jobDescription,
                    labourTotal=command.labourTotal,
                    notes=command.notes,
                    opportunityId=command.opportunityId,
                    orderNumber=command.orderNumber,
                    orderTime=datetime.fromisoformat(command.orderTime.replace('Z', '+00:00')) if command.orderTime else None,
                    paidAt=datetime.fromisoformat(command.paidAt.replace('Z', '+00:00')) if command.paidAt else None,
                    partsDescription=command.partsDescription,
                    partsTotal=command.partsTotal,
                    paymentTerms=command.paymentTerms,
                    projectId=command.projectId,
                    quoteId=command.quoteId,
                    sentAt=datetime.fromisoformat(command.sentAt.replace('Z', '+00:00')) if command.sentAt else None,
                    shippingAddress=command.shippingAddress,
                    status=command.status,
                    subtotal=command.subtotal,
                    taxAmount=command.taxAmount,
                    taxRate=command.taxRate,
                    terms=command.terms,
                    total=command.total,
                    totalPaid=command.totalPaid,
                    vehicleColor=command.vehicleColor,
                    vehicleMake=command.vehicleMake,
                    vehicleMileage=command.vehicleMileage,
                    vehicleModel=command.vehicleModel,
                    vehicleReg=command.vehicleReg,
                    vehicleVin=command.vehicleVin,
                    vehicleYear=command.vehicleYear,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(invoice)
                uow.commit()
                return Result.success(invoice)
                
        except Exception as e:
            return Result.failure(f"Failed to create invoice: {str(e)}")
