import html
import logging
from datetime import date
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from .....config.core_crud import get_tenant_by_id
from .....config.invoice_customization_models import InvoiceCustomization
from .....models.mot import MotBooking
from .....services.email_service import EmailService
from .....services.invoice_share import get_share_base_url

logger = logging.getLogger(__name__)

DELIVERY_LABELS = {
    "drop_off": "Drop off — own onward travel",
    "wait_security": "Wait on site (security update)",
    "wait_on_site": "Wait on site while vehicle is tested",
}


def _format_booking_date(value: date) -> str:
    return value.strftime("%A, %d %B %Y")


def _format_price(value: Any) -> str:
    if value is None:
        return "—"
    amount = float(value) if not isinstance(value, (int, float)) else value
    return f"£{amount:,.2f}"


def _short_ref(booking_id: str) -> str:
    return str(booking_id).replace("-", "").upper()[:8]


def _load_branding(db: Session, tenant_id: str) -> Dict[str, Optional[str]]:
    tenant = get_tenant_by_id(tenant_id, db)
    if not tenant:
        return {
            "tenant_name": "Workshop",
            "tenant_domain": "",
            "logo_url": None,
            "company_name": "Workshop",
            "company_email": None,
            "company_phone": None,
            "company_address": None,
            "primary_color": "#2563eb",
            "footer_text": None,
        }

    customization = (
        db.query(InvoiceCustomization)
        .filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True,
        )
        .first()
    )

    company_name = customization.company_name if customization else tenant.name
    return {
        "tenant_name": tenant.name,
        "tenant_domain": tenant.domain or "",
        "logo_url": tenant.logo_url or (customization.company_logo_url if customization else None),
        "company_name": company_name,
        "company_email": customization.company_email if customization else None,
        "company_phone": customization.company_phone if customization else None,
        "company_address": customization.company_address if customization else None,
        "primary_color": (customization.primary_color if customization else None) or "#2563eb",
        "footer_text": customization.footer_text if customization else None,
    }


def _vehicle_line(booking: MotBooking) -> str:
    parts = [
        booking.vehicle_registration,
        booking.vehicle_make,
        booking.vehicle_model,
        booking.vehicle_year,
    ]
    cleaned = [p.strip() for p in parts if p and str(p).strip()]
    return " · ".join(cleaned) if cleaned else "Your vehicle"


def _build_confirmation_url(tenant_domain: str, booking_id: str) -> Optional[str]:
    if not tenant_domain:
        return None
    base = get_share_base_url()
    return f"{base}/{tenant_domain}/mot/bookings/{booking_id}/confirmation"


def _build_mot_booking_email(
    booking: MotBooking,
    branding: Dict[str, Optional[str]],
) -> Dict[str, str]:
    company = branding["company_name"] or branding["tenant_name"] or "Workshop"
    primary = branding["primary_color"] or "#2563eb"
    customer = html.escape(booking.customer_name or "Customer")
    vehicle = html.escape(_vehicle_line(booking))
    booking_date = _format_booking_date(booking.booking_date)
    time_slot = f"{booking.start_time} – {booking.end_time}"
    delivery = DELIVERY_LABELS.get(booking.delivery_option or "", booking.delivery_option or "—")
    delivery = html.escape(delivery or "—")
    price = _format_price(booking.price)
    ref = _short_ref(str(booking.id))
    confirmation_url = _build_confirmation_url(
        branding.get("tenant_domain") or "",
        str(booking.id),
    )

    contact_lines = []
    if branding.get("company_phone"):
        contact_lines.append(branding["company_phone"])
    if branding.get("company_email"):
        contact_lines.append(branding["company_email"])
    if branding.get("company_address"):
        contact_lines.append(branding["company_address"])
    contact_html = "<br>".join(html.escape(line).replace("\n", "<br>") for line in contact_lines) if contact_lines else ""

    logo_html = ""
    if branding.get("logo_url"):
        logo_url = html.escape(branding["logo_url"])
        logo_html = (
            f'<img src="{logo_url}" alt="{html.escape(company)}" '
            f'style="max-height:48px;max-width:180px;margin-bottom:12px;" />'
        )

    cta_html = ""
    if confirmation_url:
        safe_url = html.escape(confirmation_url)
        cta_html = f"""
        <tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="{safe_url}" style="display:inline-block;background:{primary};color:#ffffff;
              text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;
              border-radius:10px;">View booking details</a>
          </td>
        </tr>"""

    footer_note = branding.get("footer_text") or f"Thank you for choosing {company}."
    footer_note_html = html.escape(footer_note)

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:{primary};padding:32px 32px 28px;text-align:center;">
              {logo_html}
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">{html.escape(company)}</p>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:800;">Your MOT is booked</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">Hi {customer},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                We've confirmed your MOT appointment. Please find your booking summary below.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Reference</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">#{ref}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Date &amp; time</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{html.escape(booking_date)}</p>
                    <p style="margin:6px 0 0;color:#475569;font-size:14px;">{html.escape(time_slot)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Vehicle</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{vehicle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Collection option</p>
                    <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.5;">{delivery}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Estimated total</p>
                    <p style="margin:0;color:{primary};font-size:22px;font-weight:800;">{html.escape(price)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {cta_html}
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
                Need to make a change? Use the link above or contact us directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:700;">{html.escape(company)}</p>
              {f'<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">{contact_html}</p>' if contact_html else ''}
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">{footer_note_html}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    plain_lines = [
        f"Hi {booking.customer_name or 'Customer'},",
        "",
        f"Your MOT appointment with {company} is confirmed.",
        "",
        f"Reference: #{ref}",
        f"Date: {booking_date}",
        f"Time: {time_slot}",
        f"Vehicle: {_vehicle_line(booking)}",
        f"Collection: {DELIVERY_LABELS.get(booking.delivery_option or '', booking.delivery_option or '—')}",
        f"Estimated total: {price}",
    ]
    if confirmation_url:
        plain_lines.extend(["", f"View booking: {confirmation_url}"])
    if contact_lines:
        plain_lines.extend(["", "Contact us:", *contact_lines])
    plain_lines.extend(["", footer_note])
    plain_body = "\n".join(line for line in plain_lines if line is not None)

    subject = f"Your MOT is booked — {company} · {booking_date}"
    return {
        "subject": subject,
        "html_body": html_body,
        "plain_body": plain_body,
        "company_name": company,
        "reply_to": branding.get("company_email"),
    }


def notify_mot_booking_confirmation(db: Session, booking: MotBooking, tenant_id: str) -> bool:
    to_email = (booking.customer_email or "").strip()
    if not to_email:
        logger.info("MOT booking %s has no customer email; skipping confirmation email", booking.id)
        return False

    branding = _load_branding(db, tenant_id)
    content = _build_mot_booking_email(booking, branding)
    email_service = EmailService()
    return email_service.send_mot_booking_confirmation_email(
        to_email=to_email,
        customer_name=booking.customer_name or "Customer",
        tenant_name=content["company_name"],
        subject=content["subject"],
        html_body=content["html_body"],
        plain_body=content["plain_body"],
        reply_to=content.get("reply_to"),
    )
