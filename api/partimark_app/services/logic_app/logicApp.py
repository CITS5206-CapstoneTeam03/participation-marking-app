from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import logging
from partimark_app.core.config import settings

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

class StudentFormData(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: str
    preferred_name: str
    image_url: str

@router.post("/webhook/forms", dependencies=[Depends(verify_logic_app_secret)])
async def handle_forms_webhook(data: StudentFormData):
    
    # TODO Update database with the received data
    # Process the received data here
    print(data)

    return {"status": "success"}