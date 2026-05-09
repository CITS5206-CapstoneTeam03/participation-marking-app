from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from api.partimark_app.crud import crud_students
from api.partimark_app.db.db import get_db
from api.partimark_app.schemas import StudentResponse, StudentCreate

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

webhook_router = APIRouter(prefix="/webhook", tags=["webhooks"])

@webhook_router.post("/forms", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student_webhook(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Azure Log
    logger.info(f"Student data received: {student_in.model_dump()}")
    """
    Webhook endpoint designed for integration with Azure Logic Apps or Microsoft Forms.
    Receives HTTP POST data directly and inserts a new student into the database.
    If the student ID or email already exists, an HTTP 400 is returned.
    """
    existing_student = crud_students.get_student(db, student_id=student_in.student_id)
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this ID already exists.",
        )

    existing_email = crud_students.get_student_by_email(db, email=student_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists.",
        )

    student_data = student_in.model_dump()
    new_student = crud_students.create_student(db, student_data=student_data)
    return new_student