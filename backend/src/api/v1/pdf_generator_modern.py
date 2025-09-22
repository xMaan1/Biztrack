import io
from datetime import datetime
from typing import Optional, Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    Image, PageBreak, KeepTogether, Frame, PageTemplate, BaseDocTemplate
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from sqlalchemy.orm import Session
import requests
from PIL import Image as PILImage
import base64

FRONTEND_COLORS = {
    'primary': '#1e40af',
    'primary_light': '#3b82f6',
    'secondary': '#6b7280',
    'accent': '#f3f4f6',
    'success': '#10b981',
    'warning': '#f59e0b',
    'danger': '#ef4444',
    'dark': '#1f2937',
    'light': '#f9fafb',
    'border': '#e5e7eb',
    'text_primary': '#111827',
    'text_secondary': '#6b7280',
    'white': '#ffffff',
    'black': '#000000'
}

def hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def hex_to_color(hex_color: str):
    hex_color = hex_color.lstrip('#')
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return colors.Color(r/255.0, g/255.0, b/255.0)

def draw_footer(canvas, doc, footer_content):
    page_width, page_height = A4
    
    footer_content = footer_content or {}
    
    footer_bg_color = footer_content.get('footer_background_color', '#1e3a8a')
    if not footer_bg_color.startswith('#'):
        footer_bg_color = '#' + footer_bg_color
    canvas.setFillColor(hex_to_color(footer_bg_color))
    canvas.rect(
        0.5*inch,
        0.5*inch,
        page_width - 1*inch,
        2*inch,
        fill=1,
        stroke=0
    )
    
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica', 7)
    
    thank_you = footer_content.get('thank_you_message', 'Thank you for your business!')
    enquiry_msg = footer_content.get('enquiry_message', 'Should you have any enquiries concerning this invoice,')
    contact_msg = footer_content.get('contact_message', 'please contact us at your convenience.')
    
    y1 = 0.5*inch + 1.2*inch
    text_width1 = canvas.stringWidth(thank_you, 'Helvetica', 7)
    x1 = (page_width - text_width1) / 2
    canvas.drawString(x1, y1, thank_you)
    
    y2 = 0.5*inch + 0.9*inch
    text_width2 = canvas.stringWidth(enquiry_msg, 'Helvetica', 7)
    x2 = (page_width - text_width2) / 2
    canvas.drawString(x2, y2, enquiry_msg)
    
    y3 = 0.5*inch + 0.6*inch
    text_width3 = canvas.stringWidth(contact_msg, 'Helvetica', 7)
    x3 = (page_width - text_width3) / 2
    canvas.drawString(x3, y3, contact_msg)
    
    payment_instructions = footer_content.get('payment_instructions')
    if payment_instructions:
        canvas.setFont('Helvetica', 6)
        payment_text = f"Payment Instructions: {payment_instructions}"
        payment_width = canvas.stringWidth(payment_text, 'Helvetica', 6)
        x_payment = (page_width - payment_width) / 2
        y_payment = 0.5*inch + 0.3*inch
        canvas.drawString(x_payment, y_payment, payment_text)

def get_customization_colors(customization: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not customization:
        return {
            'primary': hex_to_color(FRONTEND_COLORS['primary']),
            'secondary': hex_to_color(FRONTEND_COLORS['secondary']),
            'accent': hex_to_color(FRONTEND_COLORS['accent']),
            'footer_bg': hex_to_color(FRONTEND_COLORS['primary']),
            'grid': hex_to_color(FRONTEND_COLORS['border']),
            'white': hex_to_color(FRONTEND_COLORS['white'])
        }
    
    return {
        'primary': hex_to_color(customization.get('primary_color', FRONTEND_COLORS['primary'])),
        'secondary': hex_to_color(customization.get('secondary_color', FRONTEND_COLORS['secondary'])),
        'accent': hex_to_color(customization.get('accent_color', FRONTEND_COLORS['accent'])),
        'footer_bg': hex_to_color(customization.get('footer_background_color', FRONTEND_COLORS['primary'])),
        'grid': hex_to_color(customization.get('grid_color', FRONTEND_COLORS['border'])),
        'white': hex_to_color(FRONTEND_COLORS['white'])
    }

def create_styles(colors: Dict[str, Any]) -> Dict[str, ParagraphStyle]:
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors['primary'],
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors['secondary'],
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading3'],
        fontSize=10,
        textColor=colors['primary'],
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=8,
        textColor=hex_to_color(FRONTEND_COLORS['text_primary']),
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    small_style = ParagraphStyle(
        'CustomSmall',
        parent=styles['Normal'],
        fontSize=7,
        textColor=hex_to_color(FRONTEND_COLORS['text_secondary']),
        spaceAfter=3,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    footer_style = ParagraphStyle(
        'CustomFooter',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors['white'],
        spaceAfter=3,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'header': header_style,
        'body': body_style,
        'small': small_style,
        'footer': footer_style
    }

def load_company_logo(logo_url: Optional[str]) -> Optional[Image]:
    if not logo_url:
        return None
    
    try:
        if logo_url.startswith('/static/'):
            file_path = logo_url.replace('/static/', '')
            with open(file_path, 'rb') as f:
                img_data = io.BytesIO(f.read())
        else:
            response = requests.get(logo_url, timeout=10)
            response.raise_for_status()
            img_data = io.BytesIO(response.content)
        
        pil_img = PILImage.open(img_data)
        max_width, max_height = 200, 100
        pil_img.thumbnail((max_width, max_height), PILImage.Resampling.LANCZOS)
        img_buffer = io.BytesIO()
        pil_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return Image(ImageReader(img_buffer), width=min(pil_img.width, max_width), height=min(pil_img.height, max_height))
    except Exception as e:
        return None

def create_invoice_header(invoice, customization: Optional[Dict[str, Any]], styles: Dict[str, ParagraphStyle], colors: Dict[str, tuple]) -> List:
    elements = []
    
    company_name = customization.get('company_name', 'Your Company') if customization else 'Your Company'
    company_address = customization.get('company_address', '') if customization else ''
    company_phone = customization.get('company_phone', '') if customization else ''
    company_email = customization.get('company_email', '') if customization else ''
    company_website = customization.get('company_website', '') if customization else ''
    
    logo_url = customization.get('company_logo_url') if customization else None
    logo = load_company_logo(logo_url)
    
    # Create header table
    header_data = []
    
    # Left side - Company info
    company_info = []
    if logo:
        company_info.append(logo)
        company_info.append(Spacer(1, 5))
    
    company_info.append(Paragraph(company_name, styles['title']))
    
    if company_address:
        company_info.append(Paragraph(company_address.replace('\n', '<br/>'), styles['body']))
    
    contact_info = []
    if company_phone:
        contact_info.append(f"Phone: {company_phone}")
    if company_email:
        contact_info.append(f"Email: {company_email}")
    if company_website:
        contact_info.append(f"Website: {company_website}")
    
    if contact_info:
        company_info.append(Paragraph('<br/>'.join(contact_info), styles['small']))
    
    # Right side - Invoice details
    invoice_info = [
        Paragraph("INVOICE", styles['title']),
        Spacer(1, 5),
        Paragraph(f"<b>Invoice #:</b> {invoice.invoiceNumber}", styles['body']),
        Paragraph(f"<b>Issue Date:</b> {invoice.issueDate.strftime('%B %d, %Y')}", styles['body']),
        Paragraph(f"<b>Due Date:</b> {invoice.dueDate.strftime('%B %d, %Y')}", styles['body']),
    ]
    
    if hasattr(invoice, 'orderNumber') and invoice.orderNumber:
        invoice_info.append(Paragraph(f"<b>Order #:</b> {invoice.orderNumber}", styles['body']))
    
    if hasattr(invoice, 'orderTime') and invoice.orderTime:
        invoice_info.append(Paragraph(f"<b>Order Time:</b> {invoice.orderTime.strftime('%B %d, %Y %I:%M %p')}", styles['body']))
    
    # Create header table
    header_table = Table([
        [company_info, invoice_info]
    ], colWidths=[4*inch, 3*inch])
    
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 5))
    
    return elements

def create_customer_section(invoice, styles: Dict[str, ParagraphStyle]) -> List:
    elements = []
    
    elements.append(Paragraph("Bill To:", styles['header']))
    
    customer_info = [
        invoice.customerName,
    ]
    
    if hasattr(invoice, 'customerEmail') and invoice.customerEmail:
        customer_info.append(f"Email: {invoice.customerEmail}")
    
    if hasattr(invoice, 'customerPhone') and invoice.customerPhone:
        customer_info.append(f"Phone: {invoice.customerPhone}")
    
    if hasattr(invoice, 'billingAddress') and invoice.billingAddress:
        customer_info.append(invoice.billingAddress.replace('\n', '<br/>'))
    
    elements.append(Paragraph('<br/>'.join(customer_info), styles['body']))
    elements.append(Spacer(1, 5))
    
    return elements

def create_vehicle_section(invoice, customization: Optional[Dict[str, Any]], styles: Dict[str, ParagraphStyle]) -> List:
    elements = []
    
    if customization and not customization.get('show_vehicle_info', True):
        return elements
    has_vehicle_data = any([
        hasattr(invoice, 'vehicleMake') and invoice.vehicleMake,
        hasattr(invoice, 'vehicleModel') and invoice.vehicleModel,
        hasattr(invoice, 'vehicleYear') and invoice.vehicleYear,
        hasattr(invoice, 'vehicleColor') and invoice.vehicleColor,
        hasattr(invoice, 'vehicleVin') and invoice.vehicleVin,
        hasattr(invoice, 'vehicleReg') and invoice.vehicleReg,
        hasattr(invoice, 'vehicleMileage') and invoice.vehicleMileage,
    ])
    
    if not has_vehicle_data:
        return elements
    
    elements.append(Paragraph("Vehicle Information", styles['header']))
    
    vehicle_data = []
    if hasattr(invoice, 'vehicleMake') and invoice.vehicleMake:
        vehicle_data.append(f"Make: {invoice.vehicleMake}")
    if hasattr(invoice, 'vehicleModel') and invoice.vehicleModel:
        vehicle_data.append(f"Model: {invoice.vehicleModel}")
    if hasattr(invoice, 'vehicleYear') and invoice.vehicleYear:
        vehicle_data.append(f"Year: {invoice.vehicleYear}")
    if hasattr(invoice, 'vehicleColor') and invoice.vehicleColor:
        vehicle_data.append(f"Color: {invoice.vehicleColor}")
    if hasattr(invoice, 'vehicleVin') and invoice.vehicleVin:
        vehicle_data.append(f"VIN: {invoice.vehicleVin}")
    if hasattr(invoice, 'vehicleReg') and invoice.vehicleReg:
        vehicle_data.append(f"Registration: {invoice.vehicleReg}")
    if hasattr(invoice, 'vehicleMileage') and invoice.vehicleMileage:
        vehicle_data.append(f"Mileage: {invoice.vehicleMileage}")
    
    if vehicle_data:
        vehicle_table_data = []
        for i in range(0, len(vehicle_data), 2):
            row = [vehicle_data[i]]
            if i + 1 < len(vehicle_data):
                row.append(vehicle_data[i + 1])
            else:
                row.append("")
            vehicle_table_data.append(row)
        
        vehicle_table = Table(vehicle_table_data, colWidths=[3*inch, 3*inch])
        vehicle_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(vehicle_table)
    
    elements.append(Spacer(1, 5))
    return elements

def create_items_table(invoice, styles: Dict[str, ParagraphStyle], colors: Dict[str, tuple]) -> List:
    elements = []
    
    elements.append(Paragraph("Items & Services", styles['header']))
    
    headers = ['Description', 'Qty', 'Unit Price', 'Discount', 'Total']
    table_data = [headers]
    if hasattr(invoice, 'items') and invoice.items:
        for item in invoice.items:
            item_total = item['quantity'] * item['unitPrice'] * (1 - item.get('discount', 0) / 100)
            
            row = [
                item['description'],
                f"{item['quantity']:.2f}",
                f"${item['unitPrice']:.2f}",
                f"{item.get('discount', 0):.1f}%",
                f"${item_total:.2f}"
            ]
            table_data.append(row)
    
    if hasattr(invoice, 'labourTotal') and invoice.labourTotal and invoice.labourTotal > 0:
        table_data.append([
            "Labour & Services",
            "1",
            f"${invoice.labourTotal:.2f}",
            "0%",
            f"${invoice.labourTotal:.2f}"
        ])
    
    if hasattr(invoice, 'partsTotal') and invoice.partsTotal and invoice.partsTotal > 0:
        table_data.append([
            "Parts & Materials",
            "1",
            f"${invoice.partsTotal:.2f}",
            "0%",
            f"${invoice.partsTotal:.2f}"
        ])
    
    items_table = Table(table_data, colWidths=[3*inch, 0.8*inch, 1*inch, 0.8*inch, 1*inch])
    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors['primary']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors['white']),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors['grid']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors['white'], colors['accent']]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    
    items_table.setStyle(TableStyle(table_style))
    elements.append(items_table)
    elements.append(Spacer(1, 5))
    
    return elements

def create_totals_section(invoice, styles: Dict[str, ParagraphStyle], colors: Dict[str, tuple]) -> List:
    elements = []
    
    subtotal = getattr(invoice, 'subtotal', 0) or 0
    discount_rate = getattr(invoice, 'discount', 0) or 0
    discount_amount = getattr(invoice, 'discountAmount', 0) or 0
    tax_rate = getattr(invoice, 'taxRate', 0) or 0
    tax_amount = getattr(invoice, 'taxAmount', 0) or 0
    total = getattr(invoice, 'total', 0) or 0
    
    totals_data = [
        ['Subtotal:', f"${subtotal:.2f}"],
    ]
    
    if discount_rate > 0:
        totals_data.append([f'Discount ({discount_rate:.1f}%):', f"-${discount_amount:.2f}"])
    
    if tax_rate > 0:
        totals_data.append([f'Tax ({tax_rate:.1f}%):', f"${tax_amount:.2f}"])
    
    totals_data.append(['TOTAL:', f"${total:.2f}"])
    
    totals_table = Table(totals_data, colWidths=[2*inch, 1.5*inch])
    
    totals_style = [
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors['primary']),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]
    
    totals_table.setStyle(TableStyle(totals_style))
    
    totals_wrapper = Table([[totals_table]], colWidths=[7*inch])
    totals_wrapper.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
    ]))
    
    elements.append(totals_wrapper)
    elements.append(Spacer(1, 5))
    
    return elements

def create_workshop_sections(invoice, customization: Optional[Dict[str, Any]], styles: Dict[str, ParagraphStyle]) -> List:
    elements = []
    
    if hasattr(invoice, 'jobDescription') and invoice.jobDescription and customization.get('show_labour_section', True):
        elements.append(Paragraph("Job Description", styles['header']))
        elements.append(Paragraph(invoice.jobDescription, styles['body']))
        elements.append(Spacer(1, 5))
    
    if hasattr(invoice, 'partsDescription') and invoice.partsDescription and customization.get('show_parts_section', True):
        elements.append(Paragraph("Parts & Materials", styles['header']))
        elements.append(Paragraph(invoice.partsDescription, styles['body']))
        elements.append(Spacer(1, 5))
    
    return elements

def create_notes_section(invoice, customization: Optional[Dict[str, Any]], styles: Dict[str, ParagraphStyle]) -> List:
    elements = []
    
    if not customization.get('show_comments_section', True):
        return elements
    
    if hasattr(invoice, 'notes') and invoice.notes:
        elements.append(Paragraph("Notes", styles['header']))
        elements.append(Paragraph(invoice.notes, styles['body']))
        elements.append(Spacer(1, 5))
    
    if hasattr(invoice, 'terms') and invoice.terms:
        elements.append(Paragraph("Terms & Conditions", styles['header']))
        elements.append(Paragraph(invoice.terms, styles['body']))
        elements.append(Spacer(1, 5))
    
    return elements

def create_footer(customization: Optional[Dict[str, Any]], styles: Dict[str, ParagraphStyle], colors: Dict[str, Any]) -> List:
    elements = []
    
    elements.append(Spacer(1, 5))
    
    footer_content = []
    
    thank_you = customization.get('thank_you_message', 'Thank you for your business!') if customization else 'Thank you for your business!'
    footer_content.append(Paragraph(thank_you, styles['footer']))
    
    enquiry_msg = customization.get('enquiry_message', 'Should you have any enquiries concerning this invoice,') if customization else 'Should you have any enquiries concerning this invoice,'
    contact_msg = customization.get('contact_message', 'please contact us at your convenience.') if customization else 'please contact us at your convenience.'
    
    footer_content.append(Paragraph(f"{enquiry_msg} {contact_msg}", styles['footer']))
    footer_content.append(Spacer(1, 4))
    
    payment_instructions = customization.get('payment_instructions', 'Make all payments to your company name') if customization else 'Make all payments to your company name'
    footer_content.append(Paragraph(f"<b>Payment Instructions:</b> {payment_instructions}", styles['footer']))
    
    if customization:
        bank_sort_code = customization.get('bank_sort_code')
        bank_account = customization.get('bank_account_number')
        if bank_sort_code and bank_account:
            footer_content.append(Paragraph(f"<b>Bank Details:</b> Sort Code: {bank_sort_code}, Account: {bank_account}", styles['footer']))
    
    if customization and customization.get('footer_text'):
        footer_content.append(Spacer(1, 4))
        footer_content.append(Paragraph(customization['footer_text'], styles['footer']))
    
    if customization and customization.get('show_contact_info_in_footer', True):
        contact_info = []
        if customization.get('company_phone'):
            contact_info.append(f"Phone: {customization['company_phone']}")
        if customization.get('company_email'):
            contact_info.append(f"Email: {customization['company_email']}")
        if customization.get('company_website'):
            contact_info.append(f"Website: {customization['company_website']}")
        
        if contact_info:
            footer_content.append(Spacer(1, 4))
            footer_content.append(Paragraph(" | ".join(contact_info), styles['footer']))
    
    footer_table = Table([[footer_content]], colWidths=[7*inch])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors['footer_bg']),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(footer_table)
    
    return elements

def generate_modern_invoice_pdf(invoice, db: Session) -> bytes:
    try:
        from ...config.invoice_customization_models import InvoiceCustomization
        
        customization_obj = db.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == invoice.tenant_id,
            InvoiceCustomization.is_active == True
        ).first()
        
        customization = None
        if customization_obj:
            customization = {
                'company_name': customization_obj.company_name,
                'company_logo_url': customization_obj.company_logo_url,
                'company_address': customization_obj.company_address,
                'company_phone': customization_obj.company_phone,
                'company_email': customization_obj.company_email,
                'company_website': customization_obj.company_website,
                'bank_sort_code': customization_obj.bank_sort_code,
                'bank_account_number': customization_obj.bank_account_number,
                'payment_instructions': customization_obj.payment_instructions,
                'primary_color': customization_obj.primary_color,
                'secondary_color': customization_obj.secondary_color,
                'accent_color': customization_obj.accent_color,
                'show_vehicle_info': customization_obj.show_vehicle_info,
                'show_parts_section': customization_obj.show_parts_section,
                'show_labour_section': customization_obj.show_labour_section,
                'show_comments_section': customization_obj.show_comments_section,
                'footer_text': customization_obj.footer_text,
                'show_contact_info_in_footer': customization_obj.show_contact_info_in_footer,
                'footer_background_color': customization_obj.footer_background_color,
                'grid_color': customization_obj.grid_color,
                'thank_you_message': customization_obj.thank_you_message,
                'enquiry_message': customization_obj.enquiry_message,
                'contact_message': customization_obj.contact_message,
                'default_payment_instructions': customization_obj.default_payment_instructions,
            }
        
        
        colors = get_customization_colors(customization)
        
        styles = create_styles(colors)
        
        buffer = io.BytesIO()
        
        def on_page(canvas, doc):
            draw_footer(canvas, doc, customization)
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=2.5*inch
        )
        
        story = []
        
        story.extend(create_invoice_header(invoice, customization, styles, colors))
        
        story.extend(create_customer_section(invoice, styles))
        
        story.extend(create_vehicle_section(invoice, customization, styles))
        
        story.extend(create_items_table(invoice, styles, colors))
        
        story.extend(create_workshop_sections(invoice, customization, styles))
        
        story.extend(create_notes_section(invoice, customization, styles))
        
        story.extend(create_totals_section(invoice, styles, colors))
        
        doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
        
    except Exception as e:
        raise ValueError(f"Failed to generate invoice PDF: {str(e)}")
