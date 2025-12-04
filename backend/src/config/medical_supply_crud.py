import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .medical_supply_models import MedicalSupply

def generate_supply_id(db: Session, tenant_id: str) -> str:
    last_supply = db.query(MedicalSupply).filter(
        MedicalSupply.tenant_id == tenant_id
    ).order_by(desc(MedicalSupply.supplyId)).first()
    
    if last_supply and last_supply.supplyId:
        try:
            last_number = int(last_supply.supplyId.replace("MSUP", ""))
            new_number = last_number + 1
        except ValueError:
            new_number = 1
    else:
        new_number = 1
    
    return f"MSUP{new_number:06d}"

def create_medical_supply(db: Session, supply_data: Dict[str, Any], tenant_id: str) -> MedicalSupply:
    try:
        supply_data["supplyId"] = generate_supply_id(db, tenant_id)
        supply_data["tenant_id"] = tenant_id
        supply_data["createdAt"] = datetime.utcnow()
        supply_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['category', 'description', 'expiryDate', 'batchNumber', 'supplier', 'location']
        for field in optional_fields:
            if field in supply_data and supply_data[field] == '':
                supply_data[field] = None
        
        supply = MedicalSupply(**supply_data)
        db.add(supply)
        db.commit()
        db.refresh(supply)
        return supply
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "supplyid" in error_msg.lower():
            raise ValueError("Medical supply with this ID already exists")
        else:
            raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def get_medical_supply_by_id(db: Session, supply_id: str, tenant_id: str) -> Optional[MedicalSupply]:
    return db.query(MedicalSupply).filter(
        and_(MedicalSupply.id == supply_id, MedicalSupply.tenant_id == tenant_id)
    ).first()

def get_medical_supplies(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None
) -> tuple[List[MedicalSupply], int]:
    query = db.query(MedicalSupply).filter(MedicalSupply.tenant_id == tenant_id)
    
    if search:
        normalized_search = ' '.join(search.split())
        search_filter = or_(
            MedicalSupply.name.ilike(f"%{normalized_search}%"),
            MedicalSupply.supplyId.ilike(f"%{normalized_search}%"),
            MedicalSupply.category.ilike(f"%{normalized_search}%")
        )
        query = query.filter(search_filter)
    
    if category:
        query = query.filter(MedicalSupply.category == category)
    
    if low_stock:
        query = query.filter(
            MedicalSupply.stockQuantity <= MedicalSupply.minStockLevel
        )
    
    total = query.count()
    supplies = query.order_by(desc(MedicalSupply.createdAt)).offset(skip).limit(limit).all()
    return supplies, total

def update_medical_supply(db: Session, supply_id: str, supply_data: Dict[str, Any], tenant_id: str) -> Optional[MedicalSupply]:
    try:
        supply = get_medical_supply_by_id(db, supply_id, tenant_id)
        if not supply:
            return None
        
        supply_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['category', 'description', 'expiryDate', 'batchNumber', 'supplier', 'location']
        for field in optional_fields:
            if field in supply_data and supply_data[field] == '':
                supply_data[field] = None
        
        for key, value in supply_data.items():
            if hasattr(supply, key):
                setattr(supply, key, value)
        
        db.commit()
        db.refresh(supply)
        return supply
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_medical_supply(db: Session, supply_id: str, tenant_id: str) -> bool:
    supply = get_medical_supply_by_id(db, supply_id, tenant_id)
    if not supply:
        return False
    
    db.delete(supply)
    db.commit()
    return True

def get_medical_supply_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_supplies = db.query(MedicalSupply).filter(MedicalSupply.tenant_id == tenant_id).count()
    low_stock_count = db.query(MedicalSupply).filter(
        MedicalSupply.tenant_id == tenant_id,
        MedicalSupply.stockQuantity <= MedicalSupply.minStockLevel
    ).count()
    
    categories = db.query(
        MedicalSupply.category,
        func.count(MedicalSupply.id).label('count')
    ).filter(
        MedicalSupply.tenant_id == tenant_id
    ).group_by(MedicalSupply.category).all()
    
    category_counts = {category: count for category, count in categories if category}
    
    total_value = db.query(
        func.sum(MedicalSupply.stockQuantity * MedicalSupply.unitPrice)
    ).filter(
        MedicalSupply.tenant_id == tenant_id
    ).scalar() or 0
    
    return {
        "total": total_supplies,
        "lowStock": low_stock_count,
        "byCategory": category_counts,
        "totalValue": float(total_value)
    }

