import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class InvoiceCustomization(Base):
    __tablename__ = "invoice_customizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    company_name = Column(String, nullable=False)
    company_logo_url = Column(String, nullable=True)
    
    company_address = Column(Text, nullable=True)
    company_phone = Column(String, nullable=True)
    company_email = Column(String, nullable=True)
    company_website = Column(String, nullable=True)
    
    bank_sort_code = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    payment_instructions = Column(Text, nullable=True)
    
    primary_color = Column(String, default="#1e40af")
    secondary_color = Column(String, default="#6b7280")
    accent_color = Column(String, default="#f3f4f6")
    
    show_vehicle_info = Column(Boolean, default=True)
    show_parts_section = Column(Boolean, default=True)
    show_labour_section = Column(Boolean, default=True)
    show_comments_section = Column(Boolean, default=True)
    
    footer_text = Column(Text, nullable=True)
    show_contact_info_in_footer = Column(Boolean, default=True)
    footer_background_color = Column(String, default="#1e3a8a")
    
    grid_color = Column(String, default="#cccccc")
    
    thank_you_message = Column(Text, default="Thank you for your business!")
    enquiry_message = Column(Text, default="Should you have any enquiries concerning this invoice,")
    contact_message = Column(Text, default="please contact us at your convenience.")
    
    default_payment_instructions = Column(Text, default="Make all payments to your company name")
    
    default_currency = Column(String, default="USD")
    
    custom_fields = Column(JSON, default={})
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="invoice_customizations")
    creator = relationship("User", foreign_keys=[created_by])

