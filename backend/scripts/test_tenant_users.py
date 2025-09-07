#!/usr/bin/env python3
"""
Test TenantUser counting
"""

import os
import sys
sys.path.append('src')
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

def test_tenant_user_count():
    engine = create_engine(os.getenv('DATABASE_URL'))
    
    with engine.connect() as conn:
        result = conn.execute(text('''
            SELECT t.id, t.name, COUNT(tu.id) as user_count 
            FROM tenants t 
            LEFT JOIN tenant_users tu ON t.id = tu.tenant_id AND tu."isActive" = true
            GROUP BY t.id, t.name
        '''))
        print('User count per tenant (from TenantUser table):')
        for row in result:
            print(f'  Tenant: {row[1]} (ID: {row[0]}), Users: {row[2]}')

if __name__ == "__main__":
    test_tenant_user_count()
