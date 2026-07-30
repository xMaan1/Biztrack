import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    print("=== Users (agency/system) ===")
    rows = conn.execute(text("""
        SELECT u.id, u.email, u."userRole", t.name AS tenant
        FROM users u
        LEFT JOIN tenants t ON t.id = u."tenant_id"
        WHERE u.email LIKE '%agency%' OR u.email LIKE '%system%'
        ORDER BY u.email
    """)).fetchall()
    for r in rows:
        print(f"  {r.email} | role={r.userRole} | tenant={r.tenant}")

    print("\n=== Tenants ===")
    rows = conn.execute(text("SELECT id, name FROM tenants ORDER BY name")).fetchall()
    for r in rows:
        print(f"  {r.id} | {r.name}")

    print("\n=== Companies ===")
    rows = conn.execute(text("""
        SELECT c.name, c.industry, t.name AS tenant
        FROM companies c
        JOIN tenants t ON t.id = c."tenant_id"
        ORDER BY c.name
    """)).fetchall()
    for r in rows:
        print(f"  {r.name} ({r.industry}) -> {r.tenant}")
