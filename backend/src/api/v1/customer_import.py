"""
Customer Import API Endpoint

This endpoint handles bulk import of customers from CSV/Excel files.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import io
import uuid
from datetime import datetime
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...config.database import User
from ...config.crm_models import Customer
from ...config.crm_crud import create_customer, get_customer_by_email
from ...models.crm import CustomerCreate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crm", tags=["Customer Import"])

class CustomerImportResponse:
    def __init__(self, success: bool, message: str, imported_count: int = 0, 
                 failed_count: int = 0, errors: List[str] = None):
        self.success = success
        self.message = message
        self.imported_count = imported_count
        self.failed_count = failed_count
        self.errors = errors or []

@router.post("/customers/import")
async def import_customers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """
    Import customers from CSV or Excel file
    
    Expected columns:
    - firstName, lastName, email (required)
    - phone, mobile, cnic, dateOfBirth, gender
    - address, city, state, country, postalCode
    - customerType, customerStatus, creditLimit, currentBalance
    - paymentTerms, notes, tags
    """
    try:
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        tenant_id = tenant_context["tenant_id"]
        
        # Validate file type
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be CSV or Excel format"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Parse file based on extension
        try:
            if file_extension == 'csv':
                df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
            else:  # Excel files
                df = pd.read_excel(io.BytesIO(file_content))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing file: {str(e)}"
            )
        
        # Validate required columns
        required_columns = ['firstName', 'lastName', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process customers
        imported_count = 0
        failed_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Prepare customer data
                customer_data = {
                    "firstName": str(row.get('firstName', '')).strip(),
                    "lastName": str(row.get('lastName', '')).strip(),
                    "email": str(row.get('email', '')).strip().lower(),
                    "phone": str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else None,
                    "mobile": str(row.get('mobile', '')).strip() if pd.notna(row.get('mobile')) else None,
                    "cnic": str(row.get('cnic', '')).strip() if pd.notna(row.get('cnic')) else None,
                    "dateOfBirth": row.get('dateOfBirth') if pd.notna(row.get('dateOfBirth')) else None,
                    "gender": str(row.get('gender', '')).strip().lower() if pd.notna(row.get('gender')) else None,
                    "address": str(row.get('address', '')).strip() if pd.notna(row.get('address')) else None,
                    "city": str(row.get('city', '')).strip() if pd.notna(row.get('city')) else None,
                    "state": str(row.get('state', '')).strip() if pd.notna(row.get('state')) else None,
                    "country": str(row.get('country', 'Pakistan')).strip() if pd.notna(row.get('country')) else 'Pakistan',
                    "postalCode": str(row.get('postalCode', '')).strip() if pd.notna(row.get('postalCode')) else None,
                    "customerType": str(row.get('customerType', 'individual')).strip().lower() if pd.notna(row.get('customerType')) else 'individual',
                    "customerStatus": str(row.get('customerStatus', 'active')).strip().lower() if pd.notna(row.get('customerStatus')) else 'active',
                    "creditLimit": float(row.get('creditLimit', 0)) if pd.notna(row.get('creditLimit')) else 0.0,
                    "currentBalance": float(row.get('currentBalance', 0)) if pd.notna(row.get('currentBalance')) else 0.0,
                    "paymentTerms": str(row.get('paymentTerms', 'Cash')).strip() if pd.notna(row.get('paymentTerms')) else 'Cash',
                    "notes": str(row.get('notes', '')).strip() if pd.notna(row.get('notes')) else None,
                    "tags": []
                }
                
                # Validate required fields
                if not customer_data["firstName"] or not customer_data["lastName"] or not customer_data["email"]:
                    errors.append(f"Row {index + 2}: Missing required fields (firstName, lastName, email)")
                    failed_count += 1
                    continue
                
                # Validate email format
                if '@' not in customer_data["email"]:
                    errors.append(f"Row {index + 2}: Invalid email format")
                    failed_count += 1
                    continue
                
                # Check if customer already exists
                existing_customer = get_customer_by_email(customer_data["email"], db, tenant_id)
                if existing_customer:
                    errors.append(f"Row {index + 2}: Customer with email {customer_data['email']} already exists")
                    failed_count += 1
                    continue
                
                # Validate customer type
                if customer_data["customerType"] not in ['individual', 'business']:
                    customer_data["customerType"] = 'individual'
                
                # Validate customer status
                if customer_data["customerStatus"] not in ['active', 'inactive', 'blocked']:
                    customer_data["customerStatus"] = 'active'
                
                # Validate gender
                if customer_data["gender"] and customer_data["gender"] not in ['male', 'female', 'other']:
                    customer_data["gender"] = None
                
                # Process tags if provided
                if pd.notna(row.get('tags')):
                    tags_str = str(row.get('tags', '')).strip()
                    if tags_str:
                        customer_data["tags"] = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
                
                # Generate customer ID
                customer_data["customerId"] = f"CUST{str(uuid.uuid4())[:8].upper()}"
                
                # Create customer
                db_customer = create_customer(db, customer_data, tenant_id)
                if db_customer:
                    imported_count += 1
                    logger.info(f"Imported customer: {customer_data['firstName']} {customer_data['lastName']} ({customer_data['email']})")
                else:
                    errors.append(f"Row {index + 2}: Failed to create customer")
                    failed_count += 1
                    
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                failed_count += 1
                logger.error(f"Error processing row {index + 2}: {str(e)}")
        
        # Prepare response
        if imported_count > 0:
            message = f"Successfully imported {imported_count} customers"
            if failed_count > 0:
                message += f", {failed_count} failed"
        else:
            message = "No customers were imported"
        
        return CustomerImportResponse(
            success=imported_count > 0,
            message=message,
            imported_count=imported_count,
            failed_count=failed_count,
            errors=errors[:10]  # Limit errors to first 10
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in customer import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )

@router.get("/customers/import/template")
async def download_import_template():
    """
    Download a template CSV file for customer import
    """
    try:
        # Create template data
        template_data = {
            'firstName': ['John', 'Jane'],
            'lastName': ['Doe', 'Smith'],
            'email': ['john.doe@example.com', 'jane.smith@example.com'],
            'phone': ['+92-300-1234567', '+92-300-7654321'],
            'mobile': ['+92-300-1234567', '+92-300-7654321'],
            'cnic': ['12345-1234567-1', '12345-7654321-2'],
            'dateOfBirth': ['1990-01-01', '1985-05-15'],
            'gender': ['male', 'female'],
            'address': ['123 Main Street', '456 Oak Avenue'],
            'city': ['Karachi', 'Lahore'],
            'state': ['Sindh', 'Punjab'],
            'country': ['Pakistan', 'Pakistan'],
            'postalCode': ['75000', '54000'],
            'customerType': ['individual', 'business'],
            'customerStatus': ['active', 'active'],
            'creditLimit': [10000, 25000],
            'currentBalance': [0, 0],
            'paymentTerms': ['Cash', 'Credit'],
            'notes': ['VIP Customer', 'Regular Customer'],
            'tags': ['premium,vip', 'regular,standard']
        }
        
        # Create DataFrame
        df = pd.DataFrame(template_data)
        
        # Convert to CSV
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        return {
            "success": True,
            "message": "Template generated successfully",
            "template": csv_content,
            "filename": "customer_import_template.csv"
        }
        
    except Exception as e:
        logger.error(f"Error generating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate template: {str(e)}"
        )
