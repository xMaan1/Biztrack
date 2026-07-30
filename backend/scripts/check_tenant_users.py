import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    print("=== TENANT_USERS ===")
    rows = conn.execute(text("""
        SELECT tu.id, tu."tenant_id", tu."userId", tu.role, u.email
        FROM tenant_users tu
        JOIN users u ON u.id = tu."userId"
        ORDER BY u.email
    """)).fetchall()
    for r in rows:
        uid = str(r.id)[:8]
        tid = str(r.tenant_id)[:8] if r.tenant_id else "None"
        usid = str(r.userId)[:8] if r.userId else "None"
        print(f"  id={uid}... | tenant={tid}... | user={usid}... | role={r.role} | email={r.email}")

    print("\n=== TENANTS ===")
    rows = conn.execute(text("SELECT id, name, domain FROM tenants")).fetchall()
    for r in rows:
        print(f"  id={r.id} | name={r.name} | domain={r.domain}")
