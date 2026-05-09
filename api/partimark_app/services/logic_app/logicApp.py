from fastapi import APIRouter
from pydantic import BaseModel

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Sample form URL: https://forms.cloud.microsoft/r/3LLRbGEhyZ

class StudentFormData(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: str
    preferred_name: str
    image_url: str

@router.post("/webhook/forms")
async def handle_forms_webhook(data: StudentFormData):
    # Process the received data here
    print(data)

    # Azure Log Stream
    logger.info(f"Student data received: {data.model_dump()}")

    # TODO Update database with the received data

    return {"status": "success", "data_received": data}