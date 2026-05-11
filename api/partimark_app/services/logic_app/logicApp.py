from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from partimark_app.core.config import settings
from partimark_app.crud.crud_students import create_student
from partimark_app.db.db import get_db
from partimark_app.crud.crud_student_workshop_memberships import create_membership
from partimark_app.crud.crud_workshops import get_workshop_by_name
from partimark_app.schemas.students import StudentFormData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Webhook Secret Auth (No Azure AD / Entra ID needed)
api_key_header = APIKeyHeader(name="X-LogicApp-Secret", auto_error=False)

def verify_logic_app_secret(api_key: str = Security(api_key_header)):
    expected_secret = settings.logic_app_secret
    if expected_secret and api_key != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid Logic App Secret")
    elif not expected_secret:
        logger.warning("LOGIC_APP_SECRET is not set in environment variables. Webhook is currently UNPROTECTED!")
    return api_key


@router.post("api/webhook/forms", dependencies=[Depends(verify_logic_app_secret)])
async def handle_forms_webhook(data: StudentFormData, db: Session = Depends(get_db)):

    workshop = get_workshop_by_name(db, data.workshop_name)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workshop '{data.workshop_name}' not found in the database.",
        )

    create_student(
        db, 
        student_data={
            "student_id": data.student_id,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": data.email,
            "preferred_name": data.preferred_name,
            "image_url": data.image_url
        }
    )

    create_membership(
        db,
        membership_data={
            "student_id": data.student_id,
            "workshop_id": workshop.workshop_id,
            "is_current": True,
            "start_date": datetime.now(timezone.utc)
        }
    )

    return {"status": "success"}