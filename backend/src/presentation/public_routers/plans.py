from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import logging

from ...config.database import get_db, get_plans

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/plans")
async def get_public_plans(db: Session = Depends(get_db)):
    try:
        plans = get_plans(db)
        
        plans_response = []
        for plan in plans:
            plan_dict = {
                "id": str(plan.id),
                "name": plan.name,
                "description": plan.description,
                "planType": plan.planType,
                "price": plan.price,
                "billingCycle": plan.billingCycle,
                "maxProjects": plan.maxProjects,
                "maxUsers": plan.maxUsers,
                "features": plan.features,
                "isActive": plan.isActive
            }
            plans_response.append(plan_dict)
        
        return {"plans": plans_response}
        
    except Exception as e:
        logger.error(f"Error fetching public plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch plans"
        )

