import os
from sqlalchemy import create_engine, text

SRC = "883160c8-33cb-46ee-8060-5ad02bb9b320"
engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as c:
    rows = c.execute(
        text(
            """
            SELECT u.email, tu.role, tu.role_id, COUNT(c.id) cnt
            FROM contacts c
            JOIN users u ON u.id = c."assignedToId"
            JOIN tenant_users tu ON tu."userId" = u.id AND tu.tenant_id = :src
            WHERE c.tenant_id = :src AND c."assignedToId" IS NOT NULL
            GROUP BY u.email, tu.role, tu.role_id
            ORDER BY cnt DESC
            """
        ),
        {"src": SRC},
    ).fetchall()
    for r in rows:
        print(dict(r._mapping))
