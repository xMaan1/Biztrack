import os
from sqlalchemy import create_engine, text

SRC = "883160c8-33cb-46ee-8060-5ad02bb9b320"
DST = "60e7ced9-cfc2-43e4-8571-d077376b39cf"
engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as c:
    print("SOURCE ROLES")
    for r in c.execute(text("SELECT id, name FROM roles WHERE tenant_id=:t"), {"t": SRC}).fetchall():
        print(dict(r._mapping))
    print("DEST ROLES")
    for r in c.execute(text("SELECT id, name FROM roles WHERE tenant_id=:t"), {"t": DST}).fetchall():
        print(dict(r._mapping))
