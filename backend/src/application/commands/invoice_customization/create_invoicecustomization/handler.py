from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceCustomizationRepository
from ....domain.entities.invoice_customization_entity import InvoiceCustomization
from .command import CreateInvoiceCustomizationCommand

class CreateInvoiceCustomizationHandler(RequestHandlerBase[CreateInvoiceCustomizationCommand, Result[InvoiceCustomization]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateInvoiceCustomizationCommand) -> Result[InvoiceCustomization]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceCustomizationRepository(uow.session)
                
                invoicecustomization = InvoiceCustomization(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    accent_color=command.accent_color,
                    bank_account_number=command.bank_account_number,
                    bank_sort_code=command.bank_sort_code,
                    company_address=command.company_address,
                    company_email=command.company_email.lower() if command.company_email else None,
                    company_logo_url=command.company_logo_url,
                    company_name=command.company_name,
                    company_phone=command.company_phone,
                    company_website=command.company_website,
                    contact_message=command.contact_message,
                    created_by=uuid.UUID(command.created_by),
                    custom_fields=command.custom_fields or [],
                    default_currency=command.default_currency,
                    default_payment_instructions=command.default_payment_instructions,
                    enquiry_message=command.enquiry_message,
                    footer_background_color=command.footer_background_color,
                    footer_text=command.footer_text,
                    grid_color=command.grid_color,
                    is_active=command.is_active,
                    payment_instructions=command.payment_instructions,
                    primary_color=command.primary_color,
                    secondary_color=command.secondary_color,
                    show_comments_section=command.show_comments_section,
                    show_contact_info_in_footer=command.show_contact_info_in_footer,
                    show_labour_section=command.show_labour_section,
                    show_parts_section=command.show_parts_section,
                    show_vehicle_info=command.show_vehicle_info,
                    thank_you_message=command.thank_you_message,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(invoicecustomization)
                uow.commit()
                return Result.success(invoicecustomization)
                
        except Exception as e:
            return Result.failure(f"Failed to create invoicecustomization: {str(e)}")
