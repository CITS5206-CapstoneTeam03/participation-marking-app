from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.enabled_weeks import EnabledWeekCreate, EnabledWeekResponse #type:ignore
from ....crud import crud_enabled_weeks as crud #type:ignore

router = APIRouter()


class ReplaceEnabledWeeksRequest(BaseModel):
    week_numbers: List[int] = Field(default_factory=list)


@router.get("/", response_model=List[EnabledWeekResponse])
def get_enabled_weeks(db: Session = Depends(get_db)):
    return crud.get_enabled_weeks(db)


@router.post("/", response_model=EnabledWeekResponse, status_code=status.HTTP_201_CREATED)
def create_enabled_week(enabled_week_in: EnabledWeekCreate, db: Session = Depends(get_db)):
    existing_week = crud.get_enabled_week(db, enabled_week_in.week_number)
    if existing_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This week is already enabled.",
        )

    week_data = enabled_week_in.model_dump()
    new_week = crud.create_enabled_week(db, week_data=week_data)
    return new_week


@router.put("/", response_model=List[EnabledWeekResponse])
def replace_enabled_weeks(
    payload: ReplaceEnabledWeeksRequest,
    db: Session = Depends(get_db),
):
    unique_weeks = sorted(set(payload.week_numbers))

    for week_number in unique_weeks:
        if week_number < 1 or week_number > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="week_numbers must be between 1 and 12.",
            )

    return crud.replace_enabled_weeks(db, week_numbers=unique_weeks)


@router.delete("/{week_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enabled_week(week_number: int, db: Session = Depends(get_db)):
    db_enabled_week = crud.get_enabled_week(db, week_number=week_number)
    if not db_enabled_week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enabled week not found.",
        )

    crud.delete_enabled_week(db, db_enabled_week=db_enabled_week)
    return None