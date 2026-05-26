import os
from datetime import datetime, timedelta
from typing import Any, Dict

import jwt
from fastapi import HTTPException, status

from ..core.auth import SECRET_KEY, ALGORITHM

INVOICE_SHARE_EXPIRE_DAYS = int(os.getenv("INVOICE_SHARE_EXPIRE_DAYS", "90"))


def create_invoice_share_token(invoice_id: str, tenant_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=INVOICE_SHARE_EXPIRE_DAYS)
    payload = {
        "invoice_id": str(invoice_id),
        "tenant_id": str(tenant_id),
        "type": "invoice_share",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_invoice_share_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invoice link has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid invoice link",
        )

    if payload.get("type") != "invoice_share":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid invoice link",
        )
    return payload


def public_invoice_pdf_url(invoice_id: str, token: str) -> str:
    base = (
        os.getenv("API_PUBLIC_URL")
        or os.getenv("PUBLIC_API_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "https://biztrack.uk"
    ).rstrip("/")
    return f"{base}/public/invoices/{invoice_id}/pdf?token={token}"
