from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO

def generate_invoice_pdf_matching_image(invoice, db) -> bytes:
    """Generate PDF invoice matching the exact design from the reference image"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.3*inch, bottomMargin=0.3*inch, leftMargin=0.3*inch, rightMargin=0.3*inch)
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
    
    # Validate that customization exists - REQUIRED for invoice generation
    if not customization:
        raise ValueError("Invoice customization is required. Please customize your invoice template first.")
    
    # Use customization data
    company_name = customization.company_name
    company_address = customization.company_address or ""
    company_phone = customization.company_phone or ""
    company_email = customization.company_email or ""
    company_website = customization.company_website or ""
    bank_sort_code = customization.bank_sort_code or ""
    bank_account_number = customization.bank_account_number or ""
    payment_instructions = customization.payment_instructions or customization.default_payment_instructions
    primary_color = customization.primary_color
    secondary_color = customization.secondary_color
    accent_color = customization.accent_color
    show_vehicle_info = customization.show_vehicle_info
    show_parts_section = customization.show_parts_section
    show_labour_section = customization.show_labour_section
    show_comments_section = customization.show_comments_section
    footer_text = customization.footer_text
    show_contact_info_in_footer = customization.show_contact_info_in_footer
    footer_background_color = customization.footer_background_color
    grid_color = customization.grid_color
    thank_you_message = customization.thank_you_message
    enquiry_message = customization.enquiry_message
    contact_message = customization.contact_message
    
    # Create styles matching the reference image
    styles = getSampleStyleSheet()
    
    # Company name style (large, bold, centered)
    company_style = ParagraphStyle(
        'CompanyName',
        parent=styles['Normal'],
        fontSize=24,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor(primary_color),
        fontName='Helvetica-Bold'
    )
    
    # Create the header section matching the image layout
    # Company name at top center
    story.append(Paragraph(company_name, company_style))
    
    # Invoice number style (smaller, centered below company name)
    invoice_number_style = ParagraphStyle(
        'InvoiceNumber',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor(primary_color),
        fontName='Helvetica-Bold'
    )
    
    # Add invoice number below company name
    story.append(Paragraph(f"Invoice #: {invoice.invoiceNumber}", invoice_number_style))
    story.append(Spacer(1, 10))
    
    # Top section with date, customer info, and vehicle info
    # Left column - Date and Due
    left_column = [
        ["DATE", invoice.issueDate.strftime('%d-%m-%Y')],
        ["DUE", invoice.dueDate.strftime('%d-%m-%Y') if invoice.dueDate else ""]
    ]
    
    # Middle column - Customer Info
    customer_info = [
        ["NAME", invoice.customerName],
        ["ADDRESS", invoice.billingAddress or ""]
    ]
    
    # Right column - Vehicle Info (if enabled and available)
    vehicle_info = []
    if show_vehicle_info and (invoice.vehicleMake or invoice.vehicleModel):
        if invoice.vehicleMake:
            vehicle_info.append(["MAKE", invoice.vehicleMake])
        if invoice.vehicleModel:
            vehicle_info.append(["MODEL", invoice.vehicleModel])
        if invoice.vehicleYear:
            vehicle_info.append(["YEAR", invoice.vehicleYear])
        if invoice.vehicleColor:
            vehicle_info.append(["COLOR", invoice.vehicleColor])
        if invoice.vehicleVin:
            vehicle_info.append(["VIN #", invoice.vehicleVin])
        if invoice.vehicleReg:
            vehicle_info.append(["REG #", invoice.vehicleReg])
        if invoice.vehicleMileage:
            vehicle_info.append(["MILEAGE", invoice.vehicleMileage])
    
    # Create the top section table
    top_table_data = []
    
    # Add headers
    headers = ["DATE & DUE", "CUSTOMER INFO"]
    if vehicle_info:
        headers.append("VEHICLE INFO")
    top_table_data.append(headers)
    
    # Add data rows
    max_rows = max(len(left_column), len(customer_info), len(vehicle_info) if vehicle_info else 0)
    for i in range(max_rows):
        row = []
        # Wrap strings in Paragraph objects for proper rendering
        left_data = left_column[i] if i < len(left_column) else ["", ""]
        row.append([Paragraph(str(left_data[0]), styles['Normal']), Paragraph(str(left_data[1]), styles['Normal'])])
        
        customer_data = customer_info[i] if i < len(customer_info) else ["", ""]
        row.append([Paragraph(str(customer_data[0]), styles['Normal']), Paragraph(str(customer_data[1]), styles['Normal'])])
        
        if vehicle_info:
            vehicle_data = vehicle_info[i] if i < len(vehicle_info) else ["", ""]
            row.append([Paragraph(str(vehicle_data[0]), styles['Normal']), Paragraph(str(vehicle_data[1]), styles['Normal'])])
        top_table_data.append(row)
    
    # Create the top table
    top_table = Table(top_table_data, colWidths=[150, 200, 150] if vehicle_info else [150, 300])
    top_table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Data rows styling
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 1), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Grid lines
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor(grid_color)),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor(primary_color)),
    ]))
    
    story.append(top_table)
    story.append(Spacer(1, 10))
    
    # JOB PERFORMED section (Labour)
    labour_total = 0
    if show_labour_section and invoice.items:
        # Create labour items from invoice items
        labour_items = []
        
        for item in invoice.items:
            description = item.get("description", "")
            quantity = item.get("quantity", 1)
            unit_price = item.get("unitPrice", 0)
            total = quantity * unit_price
            labour_total += total
            
            labour_items.append([Paragraph(description, styles['Normal']), Paragraph(f"£{total:.2f}", styles['Normal'])])
        
        if labour_items:
            # JOB PERFORMED header
            job_header_data = [["JOB PERFORMED", ""]]
            job_header_table = Table(job_header_data, colWidths=[400, 100])
            job_header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, 0), 1, colors.HexColor(primary_color)),
            ]))
            story.append(job_header_table)
            
            # Labour items
            labour_data = [[Paragraph("Description", styles['Normal']), Paragraph("Amount", styles['Normal'])]] + labour_items
            labour_table = Table(labour_data, colWidths=[400, 100])
            labour_table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(accent_color)),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('TOPPADDING', (0, 0), (-1, 0), 6),
                
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ('TOPPADDING', (0, 1), (-1, -1), 4),
                
                # Grid lines
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ]))
            story.append(labour_table)
            
            # Labour subtotal
            labour_subtotal_data = [
                [Paragraph("SUBTOTAL", styles['Normal']), Paragraph(f"£{labour_total:.2f}", styles['Normal'])], 
                [Paragraph("VAT RATE", styles['Normal']), Paragraph("", styles['Normal'])]
            ]
            labour_subtotal_table = Table(labour_subtotal_data, colWidths=[400, 100])
            labour_subtotal_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('TOPPADDING', (0, 0), (-1, 0), 6),
                
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, 1), 10),
                ('ALIGN', (0, 1), (0, 1), 'LEFT'),
                ('ALIGN', (1, 1), (1, 1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 1), (-1, 1), 4),
                ('TOPPADDING', (0, 1), (-1, 1), 4),
                
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ]))
            story.append(labour_subtotal_table)
            story.append(Spacer(1, 8))
    
    # PARTS section
    parts_total = 0
    if show_parts_section:
        # Create parts items from invoice data
        parts_items = []
        
        # Get parts from invoice items (filter for parts/labour distinction if needed)
        # For now, we'll use all items as parts if no labour section is shown
        if not show_labour_section and invoice.items:
            for item in invoice.items:
                description = item.get("description", "")
                quantity = item.get("quantity", 1)
                unit_price = item.get("unitPrice", 0)
                total = quantity * unit_price
                parts_total += total
                
                parts_items.append([
                    Paragraph("", styles['Normal']),  # Part number (empty for now)
                    Paragraph(description, styles['Normal']),  # Part name
                    Paragraph(f"£{unit_price:.2f}", styles['Normal']),  # Unit price
                    Paragraph(f"£{total:.2f}", styles['Normal'])  # Amount
                ])
        else:
            # If labour section is shown, you might want to separate parts and labour
            # For now, we'll show a message that parts should be added separately
            parts_items.append([
                Paragraph("", styles['Normal']),
                Paragraph("Parts to be added separately", styles['Normal']),
                Paragraph("", styles['Normal']),
                Paragraph("", styles['Normal'])
            ])
        
        if parts_items:
            # PARTS header
            parts_header_data = [[Paragraph("PART #", styles['Normal']), Paragraph("PART NAME", styles['Normal']), Paragraph("UNIT PRICE", styles['Normal']), Paragraph("AMOUNT", styles['Normal'])]]
            parts_header_table = Table(parts_header_data, colWidths=[100, 200, 100, 100])
            parts_header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, 0), 1, colors.HexColor(primary_color)),
            ]))
            story.append(parts_header_table)
            
            # Parts items
            parts_data = parts_items
            parts_table = Table(parts_data, colWidths=[100, 200, 100, 100])
            parts_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ]))
            story.append(parts_table)
            
            # Parts subtotal
            parts_subtotal_data = [
                [Paragraph("SUBTOTAL", styles['Normal']), Paragraph("", styles['Normal']), Paragraph("", styles['Normal']), Paragraph(f"£{parts_total:.2f}", styles['Normal'])], 
                [Paragraph("VAT", styles['Normal']), Paragraph("", styles['Normal']), Paragraph("", styles['Normal']), Paragraph("", styles['Normal'])]
            ]
            parts_subtotal_table = Table(parts_subtotal_data, colWidths=[100, 200, 100, 100])
            parts_subtotal_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (3, 0), (3, 0), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('TOPPADDING', (0, 0), (-1, 0), 6),
                
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, 1), 10),
                ('ALIGN', (0, 1), (0, 1), 'LEFT'),
                ('ALIGN', (3, 1), (3, 1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 1), (-1, 1), 4),
                ('TOPPADDING', (0, 1), (-1, 1), 4),
                
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ]))
            story.append(parts_subtotal_table)
            story.append(Spacer(1, 8))
    
    # COMMENTS section
    if show_comments_section:
        comments_header_data = [["COMMENTS", ""]]
        comments_header_table = Table(comments_header_data, colWidths=[400, 100])
        comments_header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, 0), 1, colors.HexColor(primary_color)),
        ]))
        story.append(comments_header_table)
        
        # Comments content
        comments_content = invoice.notes or ""
        comments_data = [[Paragraph(comments_content, styles['Normal']), Paragraph("", styles['Normal'])]]
        comments_table = Table(comments_data, colWidths=[400, 100])
        comments_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ]))
        story.append(comments_table)
        story.append(Spacer(1, 10))
    
    # TOTAL SUMMARY section (right side)
    total_summary_data = [
        [Paragraph("TOTAL LABOUR", styles['Normal']), Paragraph(f"£{labour_total:.2f}", styles['Normal'])],
        [Paragraph("TOTAL PARTS", styles['Normal']), Paragraph(f"£{parts_total:.2f}", styles['Normal'])],
        [Paragraph("VAT", styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph("TOTAL", styles['Normal']), Paragraph(f"£{labour_total + parts_total:.2f}", styles['Normal'])]
    ]
    
    total_summary_table = Table(total_summary_data, colWidths=[200, 100])
    total_summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold for total
        ('FONTSIZE', (0, -1), (-1, -1), 12),  # Larger font for total
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor(primary_color)),  # Blue color for total
    ]))
    story.append(total_summary_table)
    story.append(Spacer(1, 15))
    
    # Payment and Contact Information
    payment_info_data = [
        [Paragraph(f"Make all payments to {company_name} S/C {bank_sort_code} A/C: {bank_account_number}", styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph("", styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph(thank_you_message, styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph("", styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph(enquiry_message, styles['Normal']), Paragraph("", styles['Normal'])],
        [Paragraph(f"please contact us on {company_phone}" if company_phone else contact_message, styles['Normal']), Paragraph("", styles['Normal'])]
    ]
    
    payment_info_table = Table(payment_info_data, colWidths=[400, 100])
    payment_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(payment_info_table)
    story.append(Spacer(1, 15))
    
    # Footer with company info
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.white,
        fontName='Helvetica',
        backColor=colors.HexColor(footer_background_color)
    )
    
    footer_content = []
    if footer_text:
        footer_content.append(footer_text)
    elif show_contact_info_in_footer:
        contact_parts = []
        if company_address:
            contact_parts.append(company_address)
        if company_phone:
            contact_parts.append(f"Tel: {company_phone}")
        if company_email:
            contact_parts.append(f"e-mail: {company_email}")
        if company_website:
            contact_parts.append(f"Web: {company_website}")
        if contact_parts:
            footer_content.append(" | ".join(contact_parts))
    
    if footer_content:
        story.append(Paragraph(footer_content[0], footer_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
