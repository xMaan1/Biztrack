import os
from sqlalchemy import create_engine, text

SRC = "883160c8-33cb-46ee-8060-5ad02bb9b320"
DST = "60e7ced9-cfc2-43e4-8571-d077376b39cf"
engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as c:
    print("=== DEST CONTACT ASSIGNees ===")
    rows = c.execute(
        text(
            """
            SELECT u.email, COUNT(c.id) cnt
            FROM contacts c
            JOIN users u ON u.id = c."assignedToId"
            WHERE c.tenant_id = :dst
            GROUP BY u.email
            ORDER BY cnt DESC
            """
        ),
        {"dst": DST},
    ).fetchall()
    for r in rows:
        print(dict(r._mapping))

    print("=== DEST TENANT USERS (assignees) ===")
    rows = c.execute(
        text(
            """
            SELECT u.email, tu.role
            FROM tenant_users tu
            JOIN users u ON u.id = tu."userId"
            WHERE tu.tenant_id = :dst
            ORDER BY u.email
            """
        ),
        {"dst": DST},
    ).fetchall()
    for r in rows:
        print(dict(r._mapping))

    print("=== CONTACTS WITH ATTACHMENTS ===")
    rows = c.execute(
        text(
            """
            SELECT c.id, c.email, c.attachments
            FROM contacts c
            WHERE c.tenant_id = :dst
              AND c.attachments IS NOT NULL
              AND c.attachments::text NOT IN ('[]', 'null')
            """
        ),
        {"dst": DST},
    ).fetchall()
    for r in rows:
        m = dict(r._mapping)
        atts = m.pop("attachments")
        keys = [a.get("s3_key") or a.get("url", "")[:80] for a in (atts or [])]
        print(m, keys)

    print("=== SOURCE REMAINING CONTACTS ===")
    n = c.execute(
        text("SELECT COUNT(*) FROM contacts WHERE tenant_id = :src"), {"src": SRC}
    ).scalar()
    print(n)
