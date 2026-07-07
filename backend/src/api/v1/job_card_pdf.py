import io
from datetime import datetime
from typing import Any, Dict, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from sqlalchemy.orm import Session

from ...config.job_card_crud import get_job_card_by_id
from ...config.core_crud import get_user_by_id
from ...core.currency import format_currency
from .pdf_utils import hex_to_color, safe_str, format_date, normalize_items
from .pdf_generator_modern import load_company_logo

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.5 * inch
PRIMARY_HEX = "#1e40af"
TEXT_HEX = "#111827"
BORDER_HEX = "#e5e7eb"


def _vehicle_info(jc: Any, key: str) -> str:
    vi = getattr(jc, "vehicle_info", None) or {}
    if isinstance(vi, dict):
        return safe_str(vi.get(key))
    return ""


def _technician_name(jc: Any, db: Session) -> str:
    uid = getattr(jc, "assigned_to_id", None)
    if not uid:
        return ""
    u = get_user_by_id(str(uid), db)
    if not u:
        return ""
    first = safe_str(getattr(u, "firstName", ""))
    last = safe_str(getattr(u, "lastName", ""))
    name = f"{first} {last}".strip()
    return name or safe_str(getattr(u, "userName", ""))


def _job_card_styles():
    styles = getSampleStyleSheet()
    primary = hex_to_color(PRIMARY_HEX)
    text_c = hex_to_color(TEXT_HEX)
    return {
        "title": ParagraphStyle(
            "JobCardTitle", parent=styles["Heading1"],
            fontSize=16, textColor=primary, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=12
        ),
        "header": ParagraphStyle(
            "JobCardHeader", parent=styles["Normal"],
            fontSize=9, textColor=primary, fontName="Helvetica-Bold", spaceAfter=4
        ),
        "body": ParagraphStyle(
            "JobCardBody", parent=styles["Normal"],
            fontSize=8, textColor=text_c, fontName="Helvetica", spaceAfter=4
        ),
        "small": ParagraphStyle(
            "JobCardSmall", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", spaceAfter=2
        ),
        "footer_center": ParagraphStyle(
            "JobCardFooterCenter", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", alignment=TA_CENTER, spaceAfter=0
        ),
        "company_name": ParagraphStyle(
            "JobCardCompanyName", parent=styles["Normal"],
            fontSize=14, textColor=primary, fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=2
        ),
        "company_body": ParagraphStyle(
            "JobCardCompanyBody", parent=styles["Normal"],
            fontSize=8, textColor=text_c, fontName="Helvetica", alignment=TA_LEFT, spaceAfter=2
        ),
        "company_small": ParagraphStyle(
            "JobCardCompanySmall", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", alignment=TA_LEFT, spaceAfter=1
        ),
    }


def _company_header(db: Session, tenant_id: str, styles: Dict) -> List:
    elements: List = []
    customization = None
    try:
        from ...config.invoice_customization_models import InvoiceCustomization
        customization = db.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True,
        ).first()
    except Exception:
        customization = None

    logo = load_company_logo(getattr(customization, "company_logo_url", None) if customization else None)

    company_name = (getattr(customization, "company_name", None) if customization else None) or "Your Company"
    company_address = getattr(customization, "company_address", None) if customization else None
    company_phone = getattr(customization, "company_phone", None) if customization else None
    company_email = getattr(customization, "company_email", None) if customization else None
    company_website = getattr(customization, "company_website", None) if customization else None

    company_info: List = []
    if logo:
        company_info.append(logo)
        company_info.append(Spacer(1, 5))
    company_info.append(Paragraph(safe_str(company_name), styles["company_name"]))
    if company_address:
        company_info.append(Paragraph(safe_str(company_address).replace("\n", "<br/>"), styles["company_body"]))
    contact_info = []
    if company_phone:
        contact_info.append(f"Phone: {safe_str(company_phone)}")
    if company_email:
        contact_info.append(f"Email: {safe_str(company_email)}")
    if company_website:
        contact_info.append(f"Website: {safe_str(company_website)}")
    if contact_info:
        company_info.append(Paragraph("<br/>".join(contact_info), styles["company_small"]))

    header_table = Table([[company_info]], colWidths=[7.0 * inch])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6))
    return elements


def _info_table(jc: Any, styles: Dict) -> Table:
    vi = lambda k: _vehicle_info(jc, k)
    job_date = format_date(getattr(jc, "planned_date", None)) or format_date(getattr(jc, "created_at", None))
    data = [
        ["Job No.", safe_str(jc.job_card_number), "Job Date", (job_date or "")[:16]],
        ["Reg. No.", vi("registration_number"), "Year", vi("year")],
        ["Mileage", vi("mileage"), "Make", vi("make")],
        ["Model", vi("model"), "Engine No.", vi("engine_number") or vi("engine_no")],
        ["VIN", vi("vin"), "", ""],
        ["Date/Time In", (format_date(getattr(jc, "created_at", None)) or "")[:16], "Date/Time Out", (format_date(getattr(jc, "completed_at", None)) or "")[:16]],
    ]
    t = Table(data, colWidths=[1.0 * inch, 2.0 * inch, 1.0 * inch, 2.0 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (0, -1), hex_to_color("#f3f4f6")),
        ("BACKGROUND", (2, 0), (2, -1), hex_to_color("#f3f4f6")),
        ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _parts_table(jc: Any, styles: Dict) -> tuple:
    items = normalize_items(getattr(jc, "items", None))
    subtotal = 0.0
    labour_total = 0.0
    if not items or not any(items[0].get(k) for k in ["part_no", "partNo", "description", "part_description", "unit_price", "unitPrice", "labour", "labor"]):
        subtotal = float(getattr(jc, "parts_estimate", 0) or 0)
        labour_total = float(getattr(jc, "labor_estimate", 0) or 0)
        rows = [["Part No.", "Part Desc.", "Qty", "Unit Price", "Line Total", "Labour"]]
        rows.append(["", "See estimates above", "", "", format_currency(subtotal, "USD"), format_currency(labour_total, "USD")])
    else:
        rows = [["Part No.", "Part Desc.", "Qty", "Unit Price", "Line Total", "Labour"]]
        for row in items:
            part_no = safe_str(row.get("part_no") or row.get("partNo", ""))
            part_desc = safe_str(row.get("description") or row.get("part_description", ""))
            qty = row.get("qty") or row.get("quantity", "")
            qty_s = str(qty) if qty != "" else ""
            unit_price = row.get("unit_price") or row.get("unitPrice")
            try:
                up_val = float(unit_price) if unit_price not in (None, "") else 0.0
            except (TypeError, ValueError):
                up_val = 0.0
            try:
                qty_val = float(qty) if qty != "" else 0
            except (TypeError, ValueError):
                qty_val = 0
            line_total = up_val * qty_val
            labour = row.get("labour") or row.get("labor")
            try:
                labour_val = float(labour) if labour not in (None, "") else 0.0
            except (TypeError, ValueError):
                labour_val = 0.0
            if unit_price not in (None, "") and not isinstance(unit_price, str):
                unit_price = format_currency(float(unit_price), "USD")
            else:
                unit_price = format_currency(up_val, "USD") if up_val else ""
            subtotal += line_total
            labour_total += labour_val
            line_total_s = format_currency(line_total, "USD") if line_total else ""
            labour_s = format_currency(labour_val, "USD") if labour_val else ""
            if labour not in (None, "") and not labour_s and str(labour).replace(".", "").replace("-", "").isdigit():
                labour_s = format_currency(float(labour), "USD")
            rows.append([part_no[:20], part_desc[:35], qty_s[:6], unit_price[:12], line_total_s[:12], labour_s[:12]])
    col_widths = [0.85 * inch, 2.0 * inch, 0.45 * inch, 0.9 * inch, 0.9 * inch, 0.75 * inch]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hex_to_color(PRIMARY_HEX)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t, subtotal, labour_total


def _totals_table(subtotal: float, labour_total: float, vat_rate: float = 0.15) -> tuple:
    before_vat = subtotal + labour_total
    vat_val = before_vat * vat_rate
    total_val = before_vat + vat_val
    vat_pct = f"VAT ({int(round(vat_rate * 100))}%)"
    data = [
        ["Sub Total", format_currency(before_vat, "USD")],
        [vat_pct, format_currency(vat_val, "USD")],
        ["TOTAL", format_currency(total_val, "USD")],
    ]
    t = Table(data, colWidths=[1.2 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, hex_to_color(PRIMARY_HEX)),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t, before_vat, vat_val, total_val


def generate_job_card_pdf(job_card_id: str, db: Session, tenant_id: str) -> bytes:
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise ValueError("Job card not found")
    styles = _job_card_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )
    story = []

    story.extend(_company_header(db, tenant_id, styles))

    story.append(Paragraph("VEHICLE JOB CARD", styles["title"]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Job & Vehicle Information", styles["header"]))
    story.append(_info_table(jc, styles))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Reported Defect", styles["header"]))
    desc = safe_str(getattr(jc, "description", None)) or "—"
    story.append(Paragraph(desc.replace("\n", "<br/>"), styles["body"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Completed Action", styles["header"]))
    notes = safe_str(getattr(jc, "notes", None)) or "—"
    story.append(Paragraph(notes.replace("\n", "<br/>"), styles["body"]))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Parts & Labour", styles["header"]))
    parts_tbl, subtotal, labour_total = _parts_table(jc, styles)
    story.append(parts_tbl)
    story.append(Spacer(1, 12))

    vat_rate = getattr(jc, "vat_rate", None)
    if vat_rate is None:
        vat_rate = 0.15
    totals_tbl, before_vat, vat_val, total_val = _totals_table(subtotal, labour_total, vat_rate)
    story.append(totals_tbl)
    story.append(Spacer(1, 16))

    story.append(Paragraph("This is not an invoice; all estimates are valid for 30 days.", styles["small"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Powered by Biztrack.uk", styles["footer_center"]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
