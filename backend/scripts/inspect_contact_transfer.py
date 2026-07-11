import os
import json
from collections import Counter
from sqlalchemy import create_engine, text

SOURCE = "883160c8-33cb-46ee-8060-5ad02bb9b320"
DEST = "60e7ced9-cfc2-43e4-8571-d077376b39cf"

engine = create_engine(os.environ["DATABASE_URL"])

checks = {
    "source_contacts": "SELECT COUNT(*) FROM contacts WHERE tenant_id = :src",
    "dest_contacts": "SELECT COUNT(*) FROM contacts WHERE tenant_id = :dst",
    "assignees": """
        SELECT u.email, COUNT(*) cnt
        FROM contacts c
        LEFT JOIN users u ON u.id = c."assignedToId"
        WHERE c.tenant_id = :src
        GROUP BY u.email
        ORDER BY cnt DESC
    """,
    "with_attachments": """
        SELECT COUNT(*) FROM contacts
        WHERE tenant_id = :src AND attachments IS NOT NULL AND attachments::text NOT IN ('[]', 'null')
    """,
    "with_company": "SELECT COUNT(*) FROM contacts WHERE tenant_id = :src AND \"companyId\" IS NOT NULL",
    "companies": "SELECT COUNT(*) FROM companies WHERE tenant_id = :src",
    "opportunities": "SELECT COUNT(*) FROM opportunities WHERE tenant_id = :src",
    "invoices": "SELECT COUNT(*) FROM invoices WHERE tenant_id = :src",
    "contracts": "SELECT COUNT(*) FROM contracts WHERE tenant_id = :src",
    "ledger": "SELECT COUNT(*) FROM client_payment_ledger WHERE tenant_id = :src",
    "activities": """
        SELECT COUNT(*) FROM sales_activities
        WHERE tenant_id = :src AND "relatedToType" = 'contact'
    """,
    "dest_users_in_source_assignees": """
        SELECT COUNT(DISTINCT c."assignedToId")
        FROM contacts c
        WHERE c.tenant_id = :src AND c."assignedToId" IS NOT NULL
          AND c."assignedToId" NOT IN (
            SELECT tu."userId" FROM tenant_users tu WHERE tu.tenant_id = :dst
          )
    """,
    "email_conflicts": """
        SELECT COUNT(*) FROM contacts sc
        WHERE sc.tenant_id = :src AND (
          LOWER(TRIM(sc.email)) IN (
            SELECT LOWER(TRIM(dc.email)) FROM contacts dc
            WHERE dc.tenant_id = :dst AND dc.email IS NOT NULL AND TRIM(dc.email) <> ''
          )
        )
    """,
    "sample_attachment": """
        SELECT id, "firstName", "lastName", attachments
        FROM contacts
        WHERE tenant_id = :src AND attachments IS NOT NULL AND attachments::text NOT IN ('[]', 'null')
        LIMIT 3
    """,
}

with engine.connect() as conn:
    params = {"src": SOURCE, "dst": DEST}
    for label, sql in checks.items():
        print(f"=== {label} ===")
        rows = conn.execute(text(sql), params).fetchall()
        for row in rows:
            if len(row._mapping) == 1:
                print(list(row._mapping.values())[0])
            else:
                print(dict(row._mapping))
        print()
