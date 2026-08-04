"""
LMS Platform - Database Seed Script
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from passlib.context import CryptContext
from app.core.database import get_engine, get_session_factory
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

DEPARTMENTS = [
    {"name": "Computer Science", "code": "CS", "description": "Department of Computer Science"},
    {"name": "Mathematics", "code": "MATH", "description": "Department of Mathematics"},
    {"name": "Physics", "code": "PHY", "description": "Department of Physics"},
]

ROLES = [
    {"name": "admin", "description": "System Administrator with full access"},
    {"name": "teacher", "description": "Instructor with course management capabilities"},
    {"name": "student", "description": "Student with course enrollment and learning access"},
    {"name": "public_user", "description": "Public user with limited access"},
]

USERS = [
    {"email": "admin@lms.com",  "password": "Admin@1234",   "role": "admin",   "role_id": 1, "dept_id": 1},
    {"email": "hifza@lms.com",  "password": "Teacher@1234",  "role": "teacher", "role_id": 2, "dept_id": 1},
    {"email": "faizan@lms.com", "password": "Student@1234",  "role": "student", "role_id": 3, "dept_id": 1},
]

PROFILES = [
    {"user_id": 1, "first_name": "System",  "last_name": "Administrator", "gender": "male",   "phone": "+92-300-1234567", "employee_id": "EMP-001"},
    {"user_id": 2, "first_name": "Hifza",   "last_name": "Teacher",       "gender": "female", "phone": "+92-321-7654321", "employee_id": "EMP-002"},
    {"user_id": 3, "first_name": "Faizan",  "last_name": "Student",       "gender": "male",   "phone": "+92-333-9876543", "student_id": "STU-001"},
]


def seed():
    engine = get_engine()

    with engine.connect() as conn:
        print("Resetting data...")
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table in ["course_enrollments", "lecture_progress", "attendance_records",
                       "attendance_sessions", "assignment_submissions", "assignments",
                       "grades", "audit_logs", "notifications", "face_encodings",
                       "lecture_materials", "lectures", "courses", "course_reviews",
                       "quizzes", "user_profiles", "students", "teachers", "admins",
                       "users", "departments", "roles"]:
            try:
                conn.execute(text(f"TRUNCATE TABLE {table}"))
            except Exception:
                pass
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()

        print("Seeding roles...")
        for r in ROLES:
            conn.execute(
                text("INSERT INTO roles (name, description) VALUES (:name, :desc)"),
                {"name": r["name"], "desc": r["description"]},
            )
        conn.commit()

        print("Seeding departments...")
        for d in DEPARTMENTS:
            conn.execute(
                text("INSERT INTO departments (name, code, description) VALUES (:name, :code, :desc)"),
                {"name": d["name"], "code": d["code"], "desc": d["description"]},
            )
        conn.commit()

        print("Seeding users...")
        for u in USERS:
            h = pwd_context.hash(u["password"])
            conn.execute(
                text("INSERT INTO users (email, password_hash, role, role_id, department_id, is_active, is_verified) "
                     "VALUES (:email, :pw, :role, :role_id, :dept_id, TRUE, TRUE)"),
                {"email": u["email"], "pw": h, "role": u["role"], "role_id": u["role_id"], "dept_id": u["dept_id"]},
            )
            print(f"  {u['email']} ({u['role']}) - password: {u['password']}")
        conn.commit()

        print("Seeding profiles...")
        for p in PROFILES:
            conn.execute(
                text("INSERT INTO user_profiles (user_id, first_name, last_name, gender, phone, employee_id, student_id) "
                     "VALUES (:uid, :fn, :ln, :gender, :phone, :eid, :sid)"),
                {"uid": p["user_id"], "fn": p["first_name"], "ln": p["last_name"],
                 "gender": p["gender"], "phone": p["phone"],
                 "eid": p.get("employee_id"), "sid": p.get("student_id")},
            )
        conn.commit()

    print("\nSeed complete!")
    print("\nCredentials:")
    for u in USERS:
        print(f"  {u['email']:25s} / {u['password']:15s} ({u['role']})")


if __name__ == "__main__":
    seed()
