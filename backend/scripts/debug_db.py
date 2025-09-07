#!/usr/bin/env python3
"""
Debug script to check database data
"""

import os
import sys
sys.path.append('src')
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

def debug_database():
    engine = create_engine(os.getenv('DATABASE_URL'))
    
    with engine.connect() as conn:
        # Check users table
        result = conn.execute(text('SELECT id, "userName", "tenant_id", "isActive" FROM users LIMIT 10'))
        print('Users in database:')
        for row in result:
            print(f'  ID: {row[0]}, Username: {row[1]}, Tenant ID: {row[2]}, Active: {row[3]}')
        
        print()
        
        # Check tenants table
        result = conn.execute(text('SELECT id, name, "isActive" FROM tenants LIMIT 10'))
        print('Tenants in database:')
        for row in result:
            print(f'  ID: {row[0]}, Name: {row[1]}, Active: {row[2]}')
        
        print()
        
        # Check user count per tenant
        result = conn.execute(text('''
            SELECT t.id, t.name, COUNT(u.id) as user_count 
            FROM tenants t 
            LEFT JOIN users u ON t.id = u."tenant_id" 
            GROUP BY t.id, t.name
        '''))
        print('User count per tenant:')
        for row in result:
            print(f'  Tenant: {row[1]} (ID: {row[0]}), Users: {row[2]}')

if __name__ == "__main__":
    debug_database()
