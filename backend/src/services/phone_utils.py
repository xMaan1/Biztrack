import os
import re
from typing import Any, Optional

DEFAULT_COUNTRY_CODE = os.getenv("DEFAULT_PHONE_COUNTRY_CODE", "44")


def _phone_from_phones_list(phones: Any) -> Optional[str]:
    if not phones:
        return None
    if not isinstance(phones, list):
        return None
    for item in phones:
        if isinstance(item, dict):
            value = item.get("value") or item.get("phone") or item.get("number")
            if value and str(value).strip():
                return str(value).strip()
        elif isinstance(item, str) and item.strip():
            return item.strip()
    return None


def resolve_phone_from_customer(customer: Any) -> Optional[str]:
    if not customer:
        return None
    for attr in ("phone", "mobile"):
        value = getattr(customer, attr, None)
        if value and str(value).strip():
            return str(value).strip()
    listed = _phone_from_phones_list(getattr(customer, "phones", None))
    if listed:
        return listed
    return None


def normalize_phone_for_whatsapp(
    phone: str,
    default_country_code: Optional[str] = None,
) -> str:
    if not phone or not str(phone).strip():
        raise ValueError("Phone number is required")

    country = (default_country_code or DEFAULT_COUNTRY_CODE).lstrip("+")
    raw = str(phone).strip()
    if raw.startswith("00"):
        raw = "+" + raw[2:]

    digits = re.sub(r"\D", "", raw)
    if not digits:
        raise ValueError("Invalid phone number")

    if raw.startswith("+") or len(digits) > 10:
        if digits.startswith("0") and len(digits) >= 11:
            digits = country + digits[1:]
        return digits

    if digits.startswith("0"):
        digits = country + digits[1:]
    elif len(digits) <= 10:
        digits = country + digits.lstrip("0")

    if len(digits) < 10 or len(digits) > 15:
        raise ValueError(
            "Invalid phone number. Include country code (e.g. +44 for UK)."
        )

    return digits


def build_whatsapp_url(phone_digits: str, message: str) -> str:
    import urllib.parse

    encoded = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send/?phone={phone_digits}&text={encoded}"


def build_whatsapp_picker_url(message: str) -> str:
    import urllib.parse

    encoded = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send/?text={encoded}"


def build_web_whatsapp_url(phone_digits: Optional[str], message: str) -> str:
    import urllib.parse

    encoded = urllib.parse.quote(message)
    if phone_digits:
        return f"https://web.whatsapp.com/send?phone={phone_digits}&text={encoded}"
    return f"https://web.whatsapp.com/send?text={encoded}"
