from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateInvoiceCustomizationCommand(ICommand):
    tenant_id: str
    invoicecustomization_id: str
    accent_color: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_sort_code: Optional[str] = None
    company_address: Optional[str] = None
    company_email: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_name: Optional[str] = None
    company_phone: Optional[str] = None
    company_website: Optional[str] = None
    contact_message: Optional[str] = None
    created_by: Optional[str] = None
    custom_fields: Optional[List[str]] = None
    default_currency: Optional[str] = None
    default_payment_instructions: Optional[str] = None
    enquiry_message: Optional[str] = None
    footer_background_color: Optional[str] = None
    footer_text: Optional[str] = None
    grid_color: Optional[str] = None
    is_active: Optional[bool] = None
    payment_instructions: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    show_comments_section: Optional[bool] = None
    show_contact_info_in_footer: Optional[bool] = None
    show_labour_section: Optional[bool] = None
    show_parts_section: Optional[bool] = None
    show_vehicle_info: Optional[bool] = None
    thank_you_message: Optional[str] = None
