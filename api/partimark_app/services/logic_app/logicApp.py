import json
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Sample form URL: https://forms.cloud.microsoft/r/3LLRbGEhyZ

class StudentFormData(BaseModel):
    first_name: str
    last_name: str
    avatar_url: str

@router.post("/webhook/forms")
async def handle_forms_webhook(data: StudentFormData):
    # Process the received data here
    print(data)

    # TODO Update database with the received data

    return {"status": "success", "data_received": data}
