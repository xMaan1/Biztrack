import os
from sqlalchemy import create_engine, text

engine = create_engine(os.environ["DATABASE_URL"])

queries = {
    "tenants_commerce_simon": """
        SELECT id, name, domain, "isActive"
        FROM tenants
        WHERE LOWER(name) LIKE '%commerce%' OR LOWER(domain) LIKE '%commerce%'
           OR LOWER(name) LIKE '%simon%' OR LOWER(domain) LIKE '%simon%'
           OR LOWER(name) LIKE '%square%'
        ORDER BY name
    """,
    "tenants_agency_hifi": """
        SELECT id, name, domain, "isActive"
        FROM tenants
        WHERE LOWER(name) LIKE '%agency%' OR LOWER(domain) LIKE '%agency%'
           OR LOWER(name) LIKE '%hifi%' OR LOWER(domain) LIKE '%hifi%'
           OR LOWER(name) LIKE '%marketing%'
        ORDER BY name
    """,
    "users_hifi_simon": """
        SELECT u.id, u.email, u."firstName", u."lastName"
        FROM users u
        WHERE LOWER(u.email) LIKE '%hifi%' OR LOWER(u.email) LIKE '%simon%'
           OR LOWER(u.email) LIKE '%hifimarketing%'
    """,
    "tenants_with_contacts": """
        SELECT t.id, t.name, t.domain, COUNT(c.id) AS contact_count
        FROM tenants t
        LEFT JOIN contacts c ON c.tenant_id = t.id
        GROUP BY t.id, t.name, t.domain
        HAVING COUNT(c.id) > 0
        ORDER BY contact_count DESC
    """,
    "subscriptions_by_plan": """
        SELECT t.id, t.name, t.domain, p."planType", p.name AS plan_name, s.status
        FROM subscriptions s
        JOIN tenants t ON t.id = s.tenant_id
        JOIN plans p ON p.id = s."planId"
        WHERE LOWER(t.name) LIKE '%commerce%' OR LOWER(t.name) LIKE '%agency%'
           OR LOWER(t.name) LIKE '%hifi%' OR LOWER(t.name) LIKE '%simon%'
           OR LOWER(t.name) LIKE '%testing%' OR LOWER(t.domain) LIKE '%hifi%'
        ORDER BY t.name
    """,
    "tenant_users_simon": """
        SELECT t.id, t.name, t.domain, u.email, tu.role
        FROM tenant_users tu
        JOIN tenants t ON t.id = tu.tenant_id
        JOIN users u ON u.id = tu."userId"
        WHERE LOWER(u.email) LIKE '%simon%' OR LOWER(u.email) LIKE '%hifi%'
    """,
}

with engine.connect() as conn:
    for label, sql in queries.items():
        print(f"=== {label} ===")
        rows = conn.execute(text(sql)).fetchall()
        if not rows:
            print("(none)")
        for row in rows:
            print(dict(row._mapping))
        print()
