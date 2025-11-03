from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceCustomizationRepository
from ....domain.entities.invoice_customization_entity import InvoiceCustomization
from .command import UpdateInvoiceCustomizationCommand

class UpdateInvoiceCustomizationHandler(RequestHandlerBase[UpdateInvoiceCustomizationCommand, Result[InvoiceCustomization]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateInvoiceCustomizationCommand) -> Result[InvoiceCustomization]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceCustomizationRepository(uow.session)
                
                invoicecustomization = repo.get_by_id(command.invoicecustomization_id, command.tenant_id)
                if not invoicecustomization:
                    return Result.failure("InvoiceCustomization not found")
                
                                if command.accent_color is not None:
                    invoicecustomization.accent_color = command.accent_color
                if command.bank_account_number is not None:
                    invoicecustomization.bank_account_number = command.bank_account_number
                if command.bank_sort_code is not None:
                    invoicecustomization.bank_sort_code = command.bank_sort_code
                if command.company_address is not None:
                    invoicecustomization.company_address = command.company_address
                if command.company_email is not None:
                    invoicecustomization.company_email = command.company_email.lower() if command.company_email else None
                if command.company_logo_url is not None:
                    invoicecustomization.company_logo_url = command.company_logo_url
                if command.company_name is not None:
                    invoicecustomization.company_name = command.company_name
                if command.company_phone is not None:
                    invoicecustomization.company_phone = command.company_phone
                if command.company_website is not None:
                    invoicecustomization.company_website = command.company_website
                if command.contact_message is not None:
                    invoicecustomization.contact_message = command.contact_message
                if command.created_by is not None:
                    invoicecustomization.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.custom_fields is not None:
                    invoicecustomization.custom_fields = command.custom_fields or []
                if command.default_currency is not None:
                    invoicecustomization.default_currency = command.default_currency
                if command.default_payment_instructions is not None:
                    invoicecustomization.default_payment_instructions = command.default_payment_instructions
                if command.enquiry_message is not None:
                    invoicecustomization.enquiry_message = command.enquiry_message
                if command.footer_background_color is not None:
                    invoicecustomization.footer_background_color = command.footer_background_color
                if command.footer_text is not None:
                    invoicecustomization.footer_text = command.footer_text
                if command.grid_color is not None:
                    invoicecustomization.grid_color = command.grid_color
                if command.is_active is not None:
                    invoicecustomization.is_active = command.is_active
                if command.payment_instructions is not None:
                    invoicecustomization.payment_instructions = command.payment_instructions
                if command.primary_color is not None:
                    invoicecustomization.primary_color = command.primary_color
                if command.secondary_color is not None:
                    invoicecustomization.secondary_color = command.secondary_color
                if command.show_comments_section is not None:
                    invoicecustomization.show_comments_section = command.show_comments_section
                if command.show_contact_info_in_footer is not None:
                    invoicecustomization.show_contact_info_in_footer = command.show_contact_info_in_footer
                if command.show_labour_section is not None:
                    invoicecustomization.show_labour_section = command.show_labour_section
                if command.show_parts_section is not None:
                    invoicecustomization.show_parts_section = command.show_parts_section
                if command.show_vehicle_info is not None:
                    invoicecustomization.show_vehicle_info = command.show_vehicle_info
                if command.thank_you_message is not None:
                    invoicecustomization.thank_you_message = command.thank_you_message
                
                invoicecustomization.updatedAt = datetime.utcnow()
                repo.update(invoicecustomization)
                uow.commit()
                
                return Result.success(invoicecustomization)
                
        except Exception as e:
            return Result.failure(f"Failed to update invoicecustomization: {str(e)}")
