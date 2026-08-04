import json, os, sys, uuid
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))
from src.core.auth import get_password_hash

engine = create_engine(os.getenv("DATABASE_URL"))
PASSWORD = "Test@123"

with engine.begin() as conn:
    uid = str(uuid.uuid4())
    tid = str(uuid.uuid4())
    hashed = get_password_hash(PASSWORD)
    plan_id = "4dfab409-ff38-4d65-b373-b1075a3867d6"

    # 1. Create tenant
    conn.execute(text("""
        INSERT INTO tenants (id, name, domain, description, settings, "isActive", "createdAt", "updatedAt")
        VALUES (:id, :nm, :dm, :desc, :st, true, NOW(), NOW())
    """), {"id": tid, "nm": "Agency Admin", "dm": f"agency-admin-{str(uuid.uuid4())[:8]}",
           "desc": "Agency Admin Workspace", "st": json.dumps({"plan_type": "agency"})})
    print(f"Tenant: Agency Admin")

    # 2. Create user
    conn.execute(text("""
        INSERT INTO users (id, "tenant_id", "userName", email, "firstName", "lastName",
            "hashedPassword", "userRole", "isActive", "createdAt", "updatedAt")
        VALUES (:id, :tid, :un, :em, :fn, :ln, :pw, :role, true, NOW(), NOW())
    """), {"id": uid, "tid": tid, "un": "agencyadmin", "em": "agency@system.com",
           "fn": "Agency", "ln": "Admin", "pw": hashed, "role": "admin"})
    print(f"User: agency@system.com / {PASSWORD}")

    # 3. Subscription
    conn.execute(text("""
        INSERT INTO subscriptions (id, "tenant_id", "planId", status, "startDate", "endDate", "autoRenew", "payment_provider", "createdAt", "updatedAt")
        VALUES (:id, :tid, :pid, :st, NOW(), NOW() + INTERVAL '14 days', true, :pp, NOW(), NOW())
    """), {"id": str(uuid.uuid4()), "tid": tid, "pid": plan_id, "st": "trial", "pp": "stripe"})

    # 4. Default roles
    default_roles = [
        ("owner", "Owner", json.dumps(["*"])),
        ("admin", "Admin", json.dumps(["*"])),
        ("crm_manager", "CRM Manager", json.dumps(["crm:*"])),
        ("project_manager", "Project Manager", json.dumps(["projects:*"])),
        ("team_member", "Team Member", json.dumps(["projects:view", "tasks:*"])),
        ("finance_manager", "Finance Manager", json.dumps(["finance:*"])),
        ("inventory_manager", "Inventory Manager", json.dumps(["inventory:*"])),
        ("hrm_manager", "HRM Manager", json.dumps(["hrm:*"])),
    ]
    role_ids = {}
    for name, display, perms in default_roles:
        rid = str(uuid.uuid4())
        conn.execute(text("""
            INSERT INTO roles (id, "tenant_id", name, "display_name", description, permissions, "isActive", "createdAt", "updatedAt")
            VALUES (:id, :tid, :nm, :dn, :desc, :perms, true, NOW(), NOW())
        """), {"id": rid, "tid": tid, "nm": name, "dn": display, "desc": f"{display} role", "perms": perms})
        role_ids[name] = rid

    # 5. Tenant user (owner)
    conn.execute(text("""
        INSERT INTO tenant_users (id, "tenant_id", "userId", role_id, role, custom_permissions, "isActive", "joinedAt", "createdAt", "updatedAt")
        VALUES (:id, :tid, :uid, :rid, :role, :cp, true, NOW(), NOW(), NOW())
    """), {"id": str(uuid.uuid4()), "tid": tid, "uid": uid, "rid": role_ids["owner"], "role": "owner", "cp": json.dumps([])})

    # 6. Test users
    test_users = [
        ("jane.pm", "jane@agency.com", "Jane", "Doe", "project_manager", role_ids["project_manager"]),
        ("john.dev", "john@agency.com", "John", "Smith", "team_member", role_ids["team_member"]),
        ("sarah.sales", "sarah@agency.com", "Sarah", "Jones", "sales_manager", role_ids["crm_manager"]),
        ("mike.rep", "mike@agency.com", "Mike", "Brown", "sales_representative", role_ids["team_member"]),
        ("emma.cs", "emma@agency.com", "Emma", "Wilson", "team_member", role_ids["team_member"]),
    ]
    for uname, email, fn, ln, role, rid in test_users:
        tuid = str(uuid.uuid4())
        conn.execute(text("""
            INSERT INTO users (id, "tenant_id", "userName", email, "firstName", "lastName",
                "hashedPassword", "userRole", "isActive", "createdAt", "updatedAt")
            VALUES (:id, :tid, :un, :em, :fn, :ln, :pw, :role, true, NOW(), NOW())
        """), {"id": tuid, "tid": tid, "un": uname, "em": email, "fn": fn, "ln": ln, "pw": hashed, "role": role})
        conn.execute(text("""
            INSERT INTO tenant_users (id, "tenant_id", "userId", role_id, role, custom_permissions, "isActive", "joinedAt", "createdAt", "updatedAt")
            VALUES (:id, :tid, :uid, :rid, :role, :cp, true, NOW(), NOW(), NOW())
        """), {"id": str(uuid.uuid4()), "tid": tid, "uid": tuid, "rid": rid, "role": role, "cp": json.dumps([])})
        print(f"  User: {email} / {PASSWORD}")

    # 7. Companies
    companies = [
        ("Acme Corp", "technology", "San Francisco", 5000000, 200),
        ("Globex Inc", "manufacturing", "Chicago", 12000000, 500),
        ("Initech", "technology", "Austin", 2500000, 85),
        ("Hooli Technologies", "technology", "Palo Alto", 8000000, 350),
        ("Stark Industries", "manufacturing", "New York", 15000000, 1000),
        ("Wayne Enterprises", "finance", "Gotham", 25000000, 2000),
        ("Oscorp", "healthcare", "Boston", 3500000, 150),
        ("Massive Dynamic", "consulting", "Seattle", 6000000, 280),
    ]
    for name, industry, city, revenue, employees in companies:
        conn.execute(text("""
            INSERT INTO companies (id, "tenant_id", "createdById", name, industry, city, country,
                "annualRevenue", "employeeCount", "isActive", "createdAt", "updatedAt")
            VALUES (:id, :tid, :uid, :nm, :ind, :city, :country, :rev, :emp, true, NOW(), NOW())
        """), {"id": str(uuid.uuid4()), "tid": tid, "uid": uid, "nm": name, "ind": industry,
               "city": city, "country": "USA", "rev": revenue, "emp": employees})
        print(f"  Company: {name}")

print("\nDone. Login with agency@system.com / Test@123")
