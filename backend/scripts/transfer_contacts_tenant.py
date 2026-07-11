import json
import os
import sys
import uuid
from copy import deepcopy

import boto3
from botocore.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SOURCE_TENANT = os.getenv("SOURCE_TENANT_ID", "883160c8-33cb-46ee-8060-5ad02bb9b320")
DEST_TENANT = os.getenv("DEST_TENANT_ID", "60e7ced9-cfc2-43e4-8571-d077376b39cf")
DRY_RUN = "--dry-run" in sys.argv or os.getenv("DRY_RUN") == "1"

TABLES_TO_MOVE = [
    "contacts",
    "leads",
    "companies",
    "opportunities",
    "invoices",
    "contracts",
    "quotes",
    "installment_plans",
    "installments",
    "client_payment_ledger",
    "sales_activities",
    "payments",
]

engine = create_engine(os.environ["DATABASE_URL"])
Session = sessionmaker(bind=engine)


def get_s3_client():
    return boto3.client(
        "s3",
        config=Config(s3={"addressing_style": "path"}),
        aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"],
        endpoint_url=os.environ["S3_ENDPOINT_URL"],
        region_name=os.environ.get("S3_REGION", "eu-north-1"),
    )


def public_url_for_key(s3_key: str) -> str:
    base = os.environ["S3_ENDPOINT_URL"].rstrip("/")
    pub = os.environ["S3_PUBLIC_ACCESS_KEY_ID"]
    bucket = os.environ["S3_BUCKET_NAME"]
    return f"{base}/{pub}:{bucket}/{s3_key}"


def rewrite_attachment(att: dict, s3, bucket: str) -> dict:
    if isinstance(att, str):
        att = {"url": att}
    item = deepcopy(att)
    old_key = item.get("s3_key")
    if not old_key and item.get("url"):
        marker = "/documents/"
        url = item["url"].split("?")[0]
        if marker in url:
            old_key = "documents/" + url.split(marker, 1)[1]
    if not old_key or not old_key.startswith(f"documents/{SOURCE_TENANT}/"):
        return item
    filename = old_key.split("/")[-1]
    new_key = f"documents/{DEST_TENANT}/{filename}"
    if old_key == new_key:
        return item
    if not DRY_RUN:
        s3.copy_object(
            Bucket=bucket,
            CopySource={"Bucket": bucket, "Key": old_key},
            Key=new_key,
        )
    item["s3_key"] = new_key
    item["url"] = public_url_for_key(new_key)
    return item


def count_rows(db, tenant_id: str) -> dict:
    counts = {}
    for table in TABLES_TO_MOVE:
        counts[table] = db.execute(
            text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = :tid"),
            {"tid": tenant_id},
        ).scalar()
    return counts


def ensure_assignees_in_dest(db):
    rows = db.execute(
        text(
            """
            SELECT DISTINCT ON (tu."userId")
                tu."userId", tu.role_id, tu.role, tu."isActive", tu.custom_permissions
            FROM contacts c
            JOIN tenant_users tu ON tu."userId" = c."assignedToId" AND tu.tenant_id = :src
            WHERE c.tenant_id = :src AND c."assignedToId" IS NOT NULL
            ORDER BY tu."userId"
            """
        ),
        {"src": SOURCE_TENANT},
    ).fetchall()
    added = 0
    for row in rows:
        exists = db.execute(
            text(
                """
                SELECT 1 FROM tenant_users
                WHERE tenant_id = :dst AND "userId" = :uid
                """
            ),
            {"dst": DEST_TENANT, "uid": str(row.userId)},
        ).first()
        if exists:
            continue
        lookup_name = "crm_manager" if row.role == "owner" else row.role
        insert_role = "crm_manager" if row.role == "owner" else row.role
        dest_role = db.execute(
            text("SELECT id FROM roles WHERE tenant_id = :dst AND name = :name LIMIT 1"),
            {"dst": DEST_TENANT, "name": lookup_name},
        ).first()
        if not dest_role:
            dest_role = db.execute(
                text(
                    "SELECT id FROM roles WHERE tenant_id = :dst AND name = 'crm_manager' LIMIT 1"
                ),
                {"dst": DEST_TENANT},
            ).first()
            insert_role = "crm_manager"
        role_id = dest_role.id
        if not DRY_RUN:
            db.execute(
                text(
                    """
                    INSERT INTO tenant_users (id, tenant_id, "userId", role_id, role, custom_permissions, "isActive")
                    VALUES (:id, :dst, :uid, :role_id, :role, :perms, :active)
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "dst": DEST_TENANT,
                    "uid": str(row.userId),
                    "role_id": str(role_id),
                    "role": insert_role,
                    "perms": json.dumps(row.custom_permissions or []),
                    "active": row.isActive,
                },
            )
        added += 1
    return added


def migrate_contact_attachments(db, s3, bucket: str) -> int:
    rows = db.execute(
        text(
            """
            SELECT id, attachments FROM contacts
            WHERE tenant_id = :src AND attachments IS NOT NULL
              AND attachments::text NOT IN ('[]', 'null')
            """
        ),
        {"src": SOURCE_TENANT},
    ).fetchall()
    updated = 0
    for row in rows:
        atts = row.attachments or []
        if not atts:
            continue
        new_atts = [rewrite_attachment(a, s3, bucket) for a in atts]
        if not DRY_RUN:
            db.execute(
                text("UPDATE contacts SET attachments = :atts WHERE id = :id"),
                {"atts": json.dumps(new_atts), "id": str(row.id)},
            )
        updated += 1
    return updated


def move_tables(db):
    moved = {}
    for table in TABLES_TO_MOVE:
        if DRY_RUN:
            n = db.execute(
                text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = :src"),
                {"src": SOURCE_TENANT},
            ).scalar()
            moved[table] = n
        else:
            result = db.execute(
                text(f"UPDATE {table} SET tenant_id = :dst WHERE tenant_id = :src"),
                {"dst": DEST_TENANT, "src": SOURCE_TENANT},
            )
            moved[table] = result.rowcount
    return moved


def main():
    print(f"SOURCE={SOURCE_TENANT}")
    print(f"DEST={DEST_TENANT}")
    print(f"DRY_RUN={DRY_RUN}")
    db = Session()
    try:
        before_src = count_rows(db, SOURCE_TENANT)
        before_dst = count_rows(db, DEST_TENANT)
        print("BEFORE source:", before_src)
        print("BEFORE dest:", before_dst)

        assignees_added = ensure_assignees_in_dest(db)
        print(f"assignees_added_to_dest={assignees_added}")

        s3 = get_s3_client()
        bucket = os.environ["S3_BUCKET_NAME"]
        attachments_updated = migrate_contact_attachments(db, s3, bucket)
        print(f"attachments_updated={attachments_updated}")

        moved = move_tables(db)
        print("MOVED:", moved)

        if DRY_RUN:
            db.rollback()
            print("DRY RUN complete - no changes committed")
        else:
            db.commit()
            after_src = count_rows(db, SOURCE_TENANT)
            after_dst = count_rows(db, DEST_TENANT)
            print("AFTER source:", after_src)
            print("AFTER dest:", after_dst)
            print("TRANSFER COMPLETE")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
