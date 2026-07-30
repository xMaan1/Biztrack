#!/usr/bin/env python3
"""Seed test users and companies under the Agency Workspace tenant."""

import json
import os
import sys
import uuid
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

load_dotenv(os.path.join(backend_dir, ".env"))

TENANT_ID = "e22cef07-b25d-4acd-88e7-1f920fd7de4b"
CREATED_BY_USER_ID = "58d800c9-859f-413f-8cbc-72749273f01a"
PASSWORD = "Test@123"

TEST_USERS = [
    {"userName": "jane.pm",     "email": "jane@agency.com",    "firstName": "Jane",   "lastName": "Doe",      "userRole": "project_manager"},
    {"userName": "john.dev",    "email": "john@agency.com",    "firstName": "John",   "lastName": "Smith",    "userRole": "team_member"},
    {"userName": "sarah.sales", "email": "sarah@agency.com",   "firstName": "Sarah",  "lastName": "Jones",    "userRole": "sales_manager"},
    {"userName": "mike.rep",    "email": "mike@agency.com",    "firstName": "Mike",   "lastName": "Brown",    "userRole": "sales_representative"},
    {"userName": "emma.cs",     "email": "emma@agency.com",    "firstName": "Emma",   "lastName": "Wilson",   "userRole": "team_member"},
]

TEST_COMPANIES = [
    {"name": "Acme Corp",          "industry": "technology",     "city": "San Francisco", "country": "USA",  "annualRevenue": 5000000,  "employeeCount": 200},
    {"name": "Globex Inc",         "industry": "manufacturing",  "city": "Chicago",       "country": "USA",  "annualRevenue": 12000000, "employeeCount": 500},
    {"name": "Initech",            "industry": "technology",     "city": "Austin",        "country": "USA",  "annualRevenue": 2500000,  "employeeCount": 85},
    {"name": "Hooli Technologies", "industry": "technology",     "city": "Palo Alto",     "country": "USA",  "annualRevenue": 8000000,  "employeeCount": 350},
    {"name": "Stark Industries",   "industry": "manufacturing",  "city": "New York",      "country": "USA",  "annualRevenue": 15000000, "employeeCount": 1000},
    {"name": "Wayne Enterprises",  "industry": "finance",        "city": "Gotham",        "country": "USA",  "annualRevenue": 25000000, "employeeCount": 2000},
    {"name": "Oscorp",             "industry": "healthcare",     "city": "Boston",        "country": "USA",  "annualRevenue": 3500000,  "employeeCount": 150},
    {"name": "Massive Dynamic",    "industry": "consulting",     "city": "Seattle",       "country": "USA",  "annualRevenue": 6000000,  "employeeCount": 280},
]


def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found")
    return create_engine(database_url)


def get_existing_role_ids(conn):
    result = conn.execute(
        text("""SELECT id, name FROM roles WHERE tenant_id = :tid"""),
        {"tid": TENANT_ID},
    )
    return {row.name: str(row.id) for row in result}


def hash_password(password: str) -> str:
    from src.core.auth import get_password_hash
    return get_password_hash(password)


def seed_users_and_companies():
    engine = get_engine()

    with engine.begin() as conn:
        roles = get_existing_role_ids(conn)
        print(f"Roles found: {roles}")

        conn.execute(
            text("""DELETE FROM companies WHERE tenant_id = :tid"""),
            {"tid": TENANT_ID},
        )
        print("  Cleared old companies")

        user_ids = {}
        for u in TEST_USERS:
            uid = str(uuid.uuid4())
            hashed = hash_password(PASSWORD)
            conn.execute(
                text("""
                    INSERT INTO users (
                        id, tenant_id, "userName", email, "firstName", "lastName",
                        "hashedPassword", "userRole", "isActive",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :tid, :uname, :email, :fname, :lname,
                        :pwd, :role, true,
                        NOW(), NOW()
                    )
                """),
                {
                    "id": uid,
                    "tid": TENANT_ID,
                    "uname": u["userName"],
                    "email": u["email"],
                    "fname": u["firstName"],
                    "lname": u["lastName"],
                    "pwd": hashed,
                    "role": u["userRole"],
                },
            )

            role_id = roles.get("owner") or roles.get("admin") or list(roles.values())[0]
            conn.execute(
                text("""
                    INSERT INTO tenant_users (
                        id, tenant_id, "userId", role_id, role, custom_permissions, "isActive",
                        "joinedAt", "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :tid, :uid, :rid, :role, :perms, true,
                        NOW(), NOW(), NOW()
                    )
                """),
                {
                    "id": str(uuid.uuid4()),
                    "tid": TENANT_ID,
                    "uid": uid,
                    "rid": role_id,
                    "role": u["userRole"],
                    "perms": json.dumps([]),
                },
            )

            user_ids[u["userName"]] = uid
            print(f"  User: {u['email']} / {PASSWORD}")

        for c in TEST_COMPANIES:
            cid = str(uuid.uuid4())
            conn.execute(
                text("""
                    INSERT INTO companies (
                        id, tenant_id, "createdById", name, industry,
                        city, country, "annualRevenue", "employeeCount", "isActive",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :tid, :createdBy, :name, :industry,
                        :city, :country, :revenue, :employees, true,
                        NOW(), NOW()
                    )
                """),
                {
                    "id": cid,
                    "tid": TENANT_ID,
                    "createdBy": CREATED_BY_USER_ID,
                    "name": c["name"],
                    "industry": c["industry"],
                    "city": c["city"],
                    "country": c["country"],
                    "revenue": c["annualRevenue"],
                    "employees": c["employeeCount"],
                },
            )
            print(f"  Company: {c['name']} ({c['industry']})")

    print("\nDone. Test users and companies seeded.")


if __name__ == "__main__":
    seed_users_and_companies()
