from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Circle
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import Flowable
from io import BytesIO
import math

class ModernHeader(Flowable):
    """Custom header with website-matching gradient and glass effect"""
    def __init__(self, company_name, invoice_number, primary_color, secondary_color):
        self.company_name = company_name
        self.invoice_number = invoice_number
        self.primary_color = primary_color
        self.secondary_color = secondary_color
        Flowable.__init__(self)
    
    def draw(self):
        canvas = self.canv
        width, height = self.width, self.height
        
        # Create website-matching gradient background
        canvas.saveState()
        
        # Primary gradient background (blue to purple like website)
        canvas.setFillColor(colors.HexColor("#3B82F6"))  # Blue start
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        
        # Add gradient overlay effect
        canvas.setFillColor(colors.HexColor("#8B5CF6"))  # Purple end
        canvas.setFillAlpha(0.7)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        
        # Glass effect overlay
        canvas.setFillColor(colors.Color(1, 1, 1, 0.15))
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        
        canvas.restoreState()
        
        # Company name with website typography
        canvas.setFont("Helvetica-Bold", 32)
        canvas.setFillColor(colors.white)
        canvas.drawCentredString(width/2, height - 45, self.company_name)
        
        # Invoice number with modern styling
        canvas.setFont("Helvetica", 16)
        canvas.setFillColor(colors.Color(1, 1, 1, 0.9))
        canvas.drawCentredString(width/2, height - 75, f"Invoice #{self.invoice_number}")
        
        # Add subtle border radius effect
        canvas.saveState()
        canvas.setStrokeColor(colors.Color(1, 1, 1, 0.2))
        canvas.setLineWidth(1)
        canvas.roundRect(5, 5, width-10, height-10, 12, stroke=1, fill=0)
        canvas.restoreState()

class ModernCard(Flowable):
    """Modern card component matching website styling"""
    def __init__(self, content_table, bg_color="#FFFFFF", border_color="#E5E7EB"):
        self.content_table = content_table
        self.bg_color = bg_color
        self.border_color = border_color
        Flowable.__init__(self)
    
    def draw(self):
        canvas = self.canv
        width, height = self.width, self.height
        
        # Draw website-matching card with glass effect
        canvas.saveState()
        
        # Shadow effect (subtle like website)
        canvas.setFillColor(colors.Color(0, 0, 0, 0.05))
        canvas.roundRect(3, -3, width, height, 16, fill=1, stroke=0)
        
        # Main card background with glass effect
        canvas.setFillColor(colors.HexColor(self.bg_color))
        canvas.setFillAlpha(0.95)  # Glass transparency
        canvas.setStrokeColor(colors.HexColor(self.border_color))
        canvas.setStrokeAlpha(0.3)
        canvas.roundRect(0, 0, width, height, 16, fill=1, stroke=1)
        
        # Add subtle inner highlight
        canvas.setFillColor(colors.Color(1, 1, 1, 0.1))
        canvas.roundRect(2, 2, width-4, height-4, 14, fill=1, stroke=0)
        
        canvas.restoreState()

def generate_modern_invoice_pdf(invoice, db) -> bytes:
    """Generate modern PDF invoice matching website styling"""
    buffer = BytesIO()
    
    # Website-matching page setup with proper margins
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        topMargin=0.6*inch, 
        bottomMargin=0.6*inch, 
        leftMargin=0.5*inch, 
        rightMargin=0.5*inch
    )
    story = []
    
    # Get tenant information
    from ...config.core_models import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == invoice.tenant_id).first()
    tenant_name = tenant.name if tenant else "Company"
    
    # Get invoice customization
    from ...config.invoice_customization_models import InvoiceCustomization as InvoiceCustomizationModel
    customization = db.query(InvoiceCustomizationModel).filter(
        InvoiceCustomizationModel.tenant_id == invoice.tenant_id,
        InvoiceCustomizationModel.is_active == True
    ).first()
    
    if not customization:
        raise ValueError("Invoice customization is required. Please customize your invoice template first.")
    
    # Use customization data with website-matching defaults
    company_name = customization.company_name
    company_address = customization.company_address or ""
    company_phone = customization.company_phone or ""
    company_email = customization.company_email or ""
    company_website = customization.company_website or ""
    bank_sort_code = customization.bank_sort_code or ""
    bank_account_number = customization.bank_account_number or ""
    payment_instructions = customization.payment_instructions or customization.default_payment_instructions
    primary_color = customization.primary_color or "#3B82F6"  # Website blue
    secondary_color = customization.secondary_color or "#8B5CF6"  # Website purple
    accent_color = customization.accent_color or "#10B981"  # Website green
    show_vehicle_info = customization.show_vehicle_info
    show_parts_section = customization.show_parts_section
    show_labour_section = customization.show_labour_section
    show_comments_section = customization.show_comments_section
    footer_text = customization.footer_text
    show_contact_info_in_footer = customization.show_contact_info_in_footer
    footer_background_color = customization.footer_background_color or "#1F2937"  # Website dark
    grid_color = customization.grid_color or "#E5E7EB"  # Website light gray
    thank_you_message = customization.thank_you_message
    enquiry_message = customization.enquiry_message
    contact_message = customization.contact_message
    
    # Create website-matching styles
    styles = getSampleStyleSheet()
    
    # Website typography styles (matching Inter font family)
    modern_title_style = ParagraphStyle(
        'WebsiteTitle',
        parent=styles['Normal'],
        fontSize=22,
        spaceAfter=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor(primary_color),
        fontName='Helvetica-Bold',
        leading=28
    )
    
    modern_subtitle_style = ParagraphStyle(
        'WebsiteSubtitle',
        parent=styles['Normal'],
        fontSize=16,
        spaceAfter=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor(secondary_color),
        fontName='Helvetica',
        leading=20
    )
    
    modern_text_style = ParagraphStyle(
        'WebsiteText',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=8,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#374151"),  # Website text color
        fontName='Helvetica',
        leading=16
    )
    
    modern_label_style = ParagraphStyle(
        'WebsiteLabel',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#6B7280"),  # Website muted text
        fontName='Helvetica-Bold',
        leading=14
    )
    
    modern_card_text_style = ParagraphStyle(
        'WebsiteCardText',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=4,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1F2937"),  # Website dark text
        fontName='Helvetica',
        leading=14
    )
    
    # Add modern header
    header = ModernHeader(company_name, invoice.invoiceNumber, primary_color, secondary_color)
    story.append(header)
    story.append(Spacer(1, 20))
    
    # Website-matching info cards section
    info_cards_data = []
    
    # Date card with website styling
    date_card = [
        [Paragraph("📅", modern_card_text_style), ""],
        [Paragraph("Issue Date", modern_label_style), Paragraph(invoice.issueDate.strftime('%B %d, %Y'), modern_card_text_style)],
        [Paragraph("Due Date", modern_label_style), Paragraph(invoice.dueDate.strftime('%B %d, %Y') if invoice.dueDate else "N/A", modern_card_text_style)]
    ]
    
    # Customer card with website styling
    customer_card = [
        [Paragraph("👤", modern_card_text_style), ""],
        [Paragraph("Customer", modern_label_style), Paragraph(invoice.customerName, modern_card_text_style)],
        [Paragraph("Email", modern_label_style), Paragraph(invoice.customerEmail or "N/A", modern_card_text_style)],
        [Paragraph("Address", modern_label_style), Paragraph(invoice.billingAddress or "N/A", modern_card_text_style)]
    ]
    
    # Vehicle card (if enabled) with website styling
    vehicle_card = []
    if show_vehicle_info and (invoice.vehicleMake or invoice.vehicleModel):
        vehicle_card = [
            [Paragraph("🚗", modern_card_text_style), ""],
            [Paragraph("Vehicle", modern_label_style), Paragraph(f"{invoice.vehicleMake or ''} {invoice.vehicleModel or ''}", modern_card_text_style)],
        ]
        if invoice.vehicleYear:
            vehicle_card.append([Paragraph("Year", modern_label_style), Paragraph(str(invoice.vehicleYear), modern_card_text_style)])
        if invoice.vehicleReg:
            vehicle_card.append([Paragraph("Registration", modern_label_style), Paragraph(invoice.vehicleReg, modern_card_text_style)])
        if invoice.vehicleVin:
            vehicle_card.append([Paragraph("VIN", modern_label_style), Paragraph(invoice.vehicleVin, modern_card_text_style)])
    
    # Create info cards layout
    cards_layout = []
    if vehicle_card:
        cards_layout = [date_card, customer_card, vehicle_card]
    else:
        cards_layout = [date_card, customer_card]
    
    for i, card_data in enumerate(cards_layout):
        card_table = Table(card_data, colWidths=[35, 125])
        card_table.setStyle(TableStyle([
            # Icon styling
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor(accent_color)),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            # Website-matching background
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),  # Website card background
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),  # Website border
        ]))
        
        # Wrap in website-matching modern card
        modern_card = ModernCard(card_table, bg_color="#F8FAFC", border_color="#E2E8F0")
        story.append(modern_card)
        story.append(Spacer(1, 12))
    
    story.append(Spacer(1, 15))
    
    # Website-matching services/items section
    if invoice.items:
        # Services header with website styling
        services_header_data = [
            [Paragraph("🔧 Services & Items", modern_title_style), "", "", ""],
            [Paragraph("Description", modern_label_style), Paragraph("Quantity", modern_label_style), 
             Paragraph("Rate", modern_label_style), Paragraph("Amount", modern_label_style)]
        ]
        
        services_table = Table(services_header_data, colWidths=[250, 80, 80, 80])
        services_table.setStyle(TableStyle([
            # Main header row styling (website gradient)
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 18),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 16),
            ('TOPPADDING', (0, 0), (-1, 0), 16),
            
            # Subheader styling (website accent)
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor(accent_color)),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.white),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 11),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 10),
            ('TOPPADDING', (0, 1), (-1, 1), 10),
            
            # Website-matching grid lines
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
        ]))
        
        story.append(services_table)
        
        # Services items with website styling
        total_amount = 0
        for item in invoice.items:
            description = item.get("description", "")
            quantity = item.get("quantity", 1)
            unit_price = item.get("unitPrice", 0)
            amount = quantity * unit_price
            total_amount += amount
            
            item_data = [
                [Paragraph(description, modern_card_text_style), 
                 Paragraph(str(quantity), modern_card_text_style),
                 Paragraph(f"£{unit_price:.2f}", modern_card_text_style),
                 Paragraph(f"£{amount:.2f}", modern_card_text_style)]
            ]
            
            item_table = Table(item_data, colWidths=[250, 80, 80, 80])
            item_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (2, 0), 'CENTER'),
                ('ALIGN', (3, 0), (3, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
            ]))
            
            story.append(item_table)
        
        story.append(Spacer(1, 10))
        
        # Website-matching totals section
        subtotal = total_amount
        tax_amount = subtotal * (invoice.taxRate / 100) if invoice.taxRate else 0
        discount_amount = subtotal * (invoice.discount / 100) if invoice.discount else 0
        final_total = subtotal + tax_amount - discount_amount
        
        totals_data = [
            [Paragraph("Subtotal", modern_card_text_style), Paragraph(f"£{subtotal:.2f}", modern_card_text_style)],
            [Paragraph("Discount", modern_card_text_style), Paragraph(f"-£{discount_amount:.2f}", modern_card_text_style)],
            [Paragraph("Tax", modern_card_text_style), Paragraph(f"£{tax_amount:.2f}", modern_card_text_style)],
            [Paragraph("", modern_card_text_style), Paragraph("", modern_card_text_style)],  # Spacer
            [Paragraph("Total", modern_title_style), Paragraph(f"£{final_total:.2f}", modern_title_style)]
        ]
        
        totals_table = Table(totals_data, colWidths=[200, 100])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -2), 12),
            ('FONTSIZE', (0, -1), (-1, -1), 18),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            # Website gradient background for total
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor(primary_color)),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor("#E2E8F0")),
            ('LINEABOVE', (0, -1), (-1, -1), 3, colors.HexColor(primary_color)),
        ]))
        
        story.append(totals_table)
        story.append(Spacer(1, 20))
    
    # Website-matching payment info section
    if payment_instructions or bank_sort_code or bank_account_number:
        payment_header_data = [["💳 Payment Information", ""]]
        payment_header_table = Table(payment_header_data, colWidths=[400, 100])
        payment_header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(secondary_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 16),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('LEFTPADDING', (0, 0), (-1, 0), 16),
            ('RIGHTPADDING', (0, 0), (-1, 0), 16),
        ]))
        story.append(payment_header_table)
        
        payment_content = []
        if bank_sort_code and bank_account_number:
            payment_content.append(f"Bank Details: Sort Code {bank_sort_code}, Account {bank_account_number}")
        if payment_instructions:
            payment_content.append(payment_instructions)
        
        if payment_content:
            payment_data = [[Paragraph("<br/>".join(payment_content), modern_card_text_style), ""]]
            payment_table = Table(payment_data, colWidths=[400, 100])
            payment_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 16),
                ('RIGHTPADDING', (0, 0), (-1, -1), 16),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),  # Website card background
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ]))
            story.append(payment_table)
            story.append(Spacer(1, 20))
    
    # Website-matching thank you message
    if thank_you_message:
        thank_you_data = [[Paragraph(f"🙏 {thank_you_message}", modern_card_text_style), ""]]
        thank_you_table = Table(thank_you_data, colWidths=[400, 100])
        thank_you_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(accent_color)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ]))
        story.append(thank_you_table)
        story.append(Spacer(1, 20))
    
    # Website-matching footer
    footer_content = []
    if footer_text:
        footer_content.append(footer_text)
    elif show_contact_info_in_footer:
        contact_parts = []
        if company_address:
            contact_parts.append(f"📍 {company_address}")
        if company_phone:
            contact_parts.append(f"📞 {company_phone}")
        if company_email:
            contact_parts.append(f"✉️ {company_email}")
        if company_website:
            contact_parts.append(f"🌐 {company_website}")
        if contact_parts:
            footer_content.append(" | ".join(contact_parts))
    
    if footer_content:
        footer_style = ParagraphStyle(
            'WebsiteFooter',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.white,
            fontName='Helvetica',
            backColor=colors.HexColor(footer_background_color)
        )
        
        footer_data = [[Paragraph(footer_content[0], footer_style), ""]]
        footer_table = Table(footer_data, colWidths=[400, 100])
        footer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(footer_background_color)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ]))
        story.append(footer_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
