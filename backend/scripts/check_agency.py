import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT id, email, "userRole", "tenant_id"
        FROM users
        WHERE email LIKE '%agency%' OR email LIKE '%system%'
        ORDER BY email
    """)).fetchall()
    for r in rows:
        print(f"{r.id} | {r.email} | {r.userRole} | tenant={r.tenant_id}")
