import os
from sqlalchemy import create_engine, text

SRC = "883160c8-33cb-46ee-8060-5ad02bb9b320"
engine = create_engine(os.environ["DATABASE_URL"])
tables = [
    "contacts", "companies", "leads", "opportunities", "invoices", "contracts",
    "client_payment_ledger", "sales_activities", "quotes", "payments",
    "installment_plans", "installments", "customers", "projects",
]
with engine.connect() as c:
    for t in tables:
        try:
            n = c.execute(text(f"SELECT COUNT(*) FROM {t} WHERE tenant_id = :src"), {"src": SRC}).scalar()
            print(f"{t}: {n}")
        except Exception as e:
            print(f"{t}: error {e}")
