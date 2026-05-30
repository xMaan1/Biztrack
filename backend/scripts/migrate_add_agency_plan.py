"""
Migrate existing Commerce plan to Agency and add a new Commerce plan row.

Run once against your database (e.g. production RDS):
  cd backend && python scripts/migrate_add_agency_plan.py

Existing subscriptions tied to the old Commerce plan row keep the same plan id;
that row becomes Agency Pro. New Commerce Pro signups use the inserted plan.
"""

import json
import os
import sys
import uuid

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL is not set")
    sys.exit(1)

COMMERCE_FEATURES = [
    "Inventory Management",
    "Point of Sale (POS)",
    "Customer Relationship Management (CRM)",
    "Sales & Invoicing",
    "Purchase Orders",
    "Warehouse Management",
    "Financial Reports",
    "Multi-location Support",
    "E-commerce Integration",
    "Barcode Scanning",
    "Customer Portal",
    "Email Marketing",
]


def main():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        agency_row = conn.execute(
            text(
                'SELECT id, name, price, "billingCycle", "maxProjects", "maxUsers", features '
                'FROM plans WHERE "planType" = :pt LIMIT 1'
            ),
            {"pt": "agency"},
        ).fetchone()
        agency_exists = agency_row is not None

        commerce_rows = conn.execute(
            text(
                'SELECT id, name, price, "billingCycle", "maxProjects", "maxUsers", features '
                'FROM plans WHERE "planType" = :pt'
            ),
            {"pt": "commerce"},
        ).fetchall()

        if agency_exists:
            print("Agency plan already exists — skipping rename step")
        elif not commerce_rows:
            print("No commerce plan found — run seed.py or create plans manually")
        elif len(commerce_rows) > 1:
            print(f"Found {len(commerce_rows)} commerce plans; manual review required")
        else:
            row = commerce_rows[0]
            conn.execute(
                text("""
                    UPDATE plans
                    SET name = :name,
                        description = :description,
                        "planType" = 'agency'
                    WHERE id = :id
                """),
                {
                    "id": row.id,
                    "name": "Agency Pro",
                    "description": "CRM, sales, POS, and operations for agencies and client-service teams",
                },
            )
            print(f"Renamed plan {row.id} to Agency Pro (planType=agency)")
            agency_row = row

        new_commerce = conn.execute(
            text('SELECT id FROM plans WHERE "planType" = :pt LIMIT 1'),
            {"pt": "commerce"},
        ).fetchone()
        if new_commerce:
            print("Commerce plan already present — nothing to insert")
        else:
            source = commerce_rows[0] if commerce_rows else agency_row
            features = COMMERCE_FEATURES
            if source and source.features:
                raw = source.features
                features = raw if isinstance(raw, list) else json.loads(raw)
            plan_id = str(uuid.uuid4())
            conn.execute(
                text("""
                    INSERT INTO plans (
                        id, name, description, "planType", price, "billingCycle",
                        "maxProjects", "maxUsers", features, modules, "isActive",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :name, :description, 'commerce', :price, :billing_cycle,
                        :max_projects, :max_users, CAST(:features AS jsonb),
                        CAST(:modules AS jsonb), true, NOW(), NOW()
                    )
                """),
                {
                    "id": plan_id,
                    "name": "Commerce Pro",
                    "description": "Complete ERP solution for retail, e-commerce, and distribution businesses",
                    "price": source.price if source else 99.99,
                    "billing_cycle": source.billingCycle if source else "monthly",
                    "max_projects": source.maxProjects if source else 50,
                    "max_users": source.maxUsers if source else 25,
                    "features": json.dumps(features),
                    "modules": "[]",
                },
            )
            print(f"Inserted Commerce Pro plan {plan_id}")

    print("Done.")


if __name__ == "__main__":
    main()
