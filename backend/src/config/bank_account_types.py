from __future__ import annotations

from enum import Enum
from typing import Any, Final, Tuple

ALLOWED_BANK_ACCOUNT_TYPE_SLUGS: Final[Tuple[str, ...]] = (
    "checking",
    "savings",
    "business",
    "credit_line",
    "money_market",
)
DEFAULT_BANK_ACCOUNT_TYPE: Final[str] = "checking"


class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"
    CREDIT_LINE = "credit_line"
    MONEY_MARKET = "money_market"


def bank_account_type_slug(v: Any) -> str:
    if v is None or (isinstance(v, str) and not v.strip()):
        return DEFAULT_BANK_ACCOUNT_TYPE
    if isinstance(v, str):
        t = v.strip()
    else:
        r = getattr(v, "value", v) if v is not None else None
        t = str(r).strip() if r is not None else ""
    if not t:
        return DEFAULT_BANK_ACCOUNT_TYPE
    nk = t.upper().replace("-", "_")
    if nk in BankAccountType.__members__:
        return BankAccountType[nk].value
    sl = t.lower().replace("-", "_")
    if sl in ALLOWED_BANK_ACCOUNT_TYPE_SLUGS:
        return sl
    for m in BankAccountType:
        if t.lower() == m.value or t.upper() == m.name:
            return m.value
    return DEFAULT_BANK_ACCOUNT_TYPE
