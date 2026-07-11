import os
import sys
from sqlalchemy import create_engine, text

engine = create_engine(os.environ["DATABASE_URL"])

def q(sql, params=None):
    with engine.connect() as c:
        rows = c.execute(text(sql), params or {}).fetchall()
        return [dict(r._mapping) for r in rows]

email = sys.argv[1] if len(sys.argv) > 1 else ""
if email:
    print("USER/TENANTS FOR", email)
    print(q(
        """
        SELECT u.id, u.email, u."firstName", u."lastName", t.id as tenant_id, t.name, t.domain, tu.role
        FROM users u
        JOIN tenant_users tu ON tu."userId" = u.id
        JOIN tenants t ON t.id = tu.tenant_id
        WHERE LOWER(u.email) = LOWER(:email)
        """,
        {"email": email},
    ))

needle = sys.argv[2] if len(sys.argv) > 2 else ""
if needle:
    print("TENANTS MATCHING", needle)
    print(q(
        """
        SELECT t.id, t.name, t.domain, t."isActive",
               (SELECT COUNT(*) FROM tenant_users tu WHERE tu.tenant_id = t.id) as members,
               (SELECT COUNT(*) FROM contacts c WHERE c.tenant_id = t.id) as contacts
        FROM tenants t
        WHERE LOWER(t.name) LIKE LOWER(:q) OR LOWER(t.domain) LIKE LOWER(:q)
        ORDER BY t.name
        """,
        {"q": f"%{needle}%"},
    ))
