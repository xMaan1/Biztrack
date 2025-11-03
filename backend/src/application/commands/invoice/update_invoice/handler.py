from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceRepository
from ....domain.entities.invoice_entity import Invoice
from .command import UpdateInvoiceCommand

class UpdateInvoiceHandler(RequestHandlerBase[UpdateInvoiceCommand, Result[Invoice]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateInvoiceCommand) -> Result[Invoice]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceRepository(uow.session)
                
                invoice = repo.get_by_id(command.invoice_id, command.tenant_id)
                if not invoice:
                    return Result.failure("Invoice not found")
                
                                if command.balance is not None:
                    invoice.balance = command.balance
                if command.billingAddress is not None:
                    invoice.billingAddress = command.billingAddress
                if command.createdBy is not None:
                    invoice.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.currency is not None:
                    invoice.currency = command.currency
                if command.customerCity is not None:
                    invoice.customerCity = command.customerCity
                if command.customerCountry is not None:
                    invoice.customerCountry = command.customerCountry
                if command.customerEmail is not None:
                    invoice.customerEmail = command.customerEmail.lower() if command.customerEmail else None
                if command.customerId is not None:
                    invoice.customerId = command.customerId
                if command.customerName is not None:
                    invoice.customerName = command.customerName
                if command.customerPhone is not None:
                    invoice.customerPhone = command.customerPhone
                if command.customerPostalCode is not None:
                    invoice.customerPostalCode = command.customerPostalCode
                if command.customerState is not None:
                    invoice.customerState = command.customerState
                if command.discount is not None:
                    invoice.discount = command.discount
                if command.discountAmount is not None:
                    invoice.discountAmount = command.discountAmount
                if command.dueDate is not None:
                    invoice.dueDate = datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else None
                if command.invoiceNumber is not None:
                    invoice.invoiceNumber = command.invoiceNumber
                if command.issueDate is not None:
                    invoice.issueDate = datetime.fromisoformat(command.issueDate.replace('Z', '+00:00')) if command.issueDate else None
                if command.items is not None:
                    invoice.items = command.items or []
                if command.jobDescription is not None:
                    invoice.jobDescription = command.jobDescription
                if command.labourTotal is not None:
                    invoice.labourTotal = command.labourTotal
                if command.notes is not None:
                    invoice.notes = command.notes
                if command.opportunityId is not None:
                    invoice.opportunityId = command.opportunityId
                if command.orderNumber is not None:
                    invoice.orderNumber = command.orderNumber
                if command.orderTime is not None:
                    invoice.orderTime = datetime.fromisoformat(command.orderTime.replace('Z', '+00:00')) if command.orderTime else None
                if command.paidAt is not None:
                    invoice.paidAt = datetime.fromisoformat(command.paidAt.replace('Z', '+00:00')) if command.paidAt else None
                if command.partsDescription is not None:
                    invoice.partsDescription = command.partsDescription
                if command.partsTotal is not None:
                    invoice.partsTotal = command.partsTotal
                if command.paymentTerms is not None:
                    invoice.paymentTerms = command.paymentTerms
                if command.projectId is not None:
                    invoice.projectId = command.projectId
                if command.quoteId is not None:
                    invoice.quoteId = command.quoteId
                if command.sentAt is not None:
                    invoice.sentAt = datetime.fromisoformat(command.sentAt.replace('Z', '+00:00')) if command.sentAt else None
                if command.shippingAddress is not None:
                    invoice.shippingAddress = command.shippingAddress
                if command.status is not None:
                    invoice.status = command.status
                if command.subtotal is not None:
                    invoice.subtotal = command.subtotal
                if command.taxAmount is not None:
                    invoice.taxAmount = command.taxAmount
                if command.taxRate is not None:
                    invoice.taxRate = command.taxRate
                if command.terms is not None:
                    invoice.terms = command.terms
                if command.total is not None:
                    invoice.total = command.total
                if command.totalPaid is not None:
                    invoice.totalPaid = command.totalPaid
                if command.vehicleColor is not None:
                    invoice.vehicleColor = command.vehicleColor
                if command.vehicleMake is not None:
                    invoice.vehicleMake = command.vehicleMake
                if command.vehicleMileage is not None:
                    invoice.vehicleMileage = command.vehicleMileage
                if command.vehicleModel is not None:
                    invoice.vehicleModel = command.vehicleModel
                if command.vehicleReg is not None:
                    invoice.vehicleReg = command.vehicleReg
                if command.vehicleVin is not None:
                    invoice.vehicleVin = command.vehicleVin
                if command.vehicleYear is not None:
                    invoice.vehicleYear = command.vehicleYear
                
                invoice.updatedAt = datetime.utcnow()
                repo.update(invoice)
                uow.commit()
                
                return Result.success(invoice)
                
        except Exception as e:
            return Result.failure(f"Failed to update invoice: {str(e)}")
