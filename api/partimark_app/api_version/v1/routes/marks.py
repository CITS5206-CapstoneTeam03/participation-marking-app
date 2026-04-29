from api.partimark_app.models import StudentStatus
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ....db.db import get_db
from ....schemas.marks import MarkCreate, MarkResponse, MarkUpdate
from ....crud import crud_marks as crud_marks
from ....crud import crud_enabled_weeks as crud_enabled_weeks
from ....services.csv import csv_export, csv_import
from ....crud import crud_students as crud_students
from ....crud.csv_export import calculate_total_and_percent_mark

router = APIRouter()


@router.post("/", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def create_mark(mark_in: MarkCreate, db: Session = Depends(get_db)):
    enabled_week = crud_enabled_weeks.get_enabled_week(db, mark_in.week_number)
    if not enabled_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This week is not enabled for participation marking.",
        )

    existing_mark = crud_marks.get_mark_by_student_and_week(
        db,
        student_id=mark_in.student_id,
        week_number=mark_in.week_number,
    )
    if existing_mark:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A mark for this student and week already exists.",
        )

    mark_data = mark_in.model_dump()
    new_mark = crud_marks.create_mark(db, mark_data=mark_data)
    return new_mark


@router.get("/", response_model=List[MarkResponse])
def get_all_marks(db: Session = Depends(get_db)):
    return crud_marks.get_all_marks(db)


@router.get("/workshop/{workshop_id}", response_model=List[MarkResponse])
def get_marks_by_workshop(workshop_id: int, db: Session = Depends(get_db)):
    marks = crud_marks.get_marks_by_workshop(db, workshop_id=workshop_id)
    return marks


@router.get("/workshop/{workshop_id}/week/{week_number}", response_model=List[MarkResponse])
def get_marks_by_workshop_and_week(
    workshop_id: int,
    week_number: int,
    db: Session = Depends(get_db),
):
    marks = crud_marks.get_marks_by_workshop_and_week(
        db,
        workshop_id=workshop_id,
        week_number=week_number,
    )
    return marks


@router.get("/{mark_id}", response_model=MarkResponse)
def get_mark(mark_id: int, db: Session = Depends(get_db)):
    mark = crud_marks.get_mark(db, mark_id=mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found.",
        )
    return mark


@router.post("/export/semester")
async def export_semester_grades(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    marks = calculate_total_and_percent_mark(db)
    inactive_students = crud_students.get_students_by_status(db, StudentStatus.WITHDRAWN)

    if not marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No marks found to export.",
        )

    try:
        content = await file.read()
        template_df = csv_import.parse_template_csv(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process the uploaded template. Please ensure the file is a .csv, .xls, or .xlsx file. Error: {str(e)}",
        )

    try:
        csv_string = csv_export.generate_lms_export(
            template_df,
            marks,
            inactive_students,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    filename = file.filename
    if filename.endswith(".xls"):
        filename = filename[:-4] + ".csv"
    elif filename.endswith(".xlsx"):
        filename = filename[:-5] + ".csv"

    response = StreamingResponse(iter([csv_string]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=populated_{filename}"
    return response


@router.put("/workshop/{workshop_id}/batch", response_model=List[MarkResponse])
def batch_update_workshop_marks(
    workshop_id: int,
    marks_in: List[MarkUpdate],
    db: Session = Depends(get_db),
):
    if not marks_in:
        return []

    week_numbers = {m.week_number for m in marks_in if m.week_number is not None}
    if len(week_numbers) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch update must target exactly one week at a time.",
        )

    target_week = next(iter(week_numbers))

    enabled_week = crud_enabled_weeks.get_enabled_week(db, target_week)
    if not enabled_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This week is not enabled for participation marking.",
        )

    existing_marks = crud_marks.get_marks_by_workshop_and_week(
        db,
        workshop_id=workshop_id,
        week_number=target_week,
    )

    if not existing_marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existing marks found for workshop {workshop_id} in week {target_week}.",
        )

    updates_data = [mark.model_dump(exclude_unset=True) for mark in marks_in]

    updated_records = crud_marks.batch_update_marks(
        db=db,
        workshop_id=workshop_id,
        existing_marks=existing_marks,
        updates_data=updates_data,
    )

    return updated_records


@router.patch("/{mark_id}", response_model=MarkResponse)
def update_mark(mark_id: int, mark_update: MarkUpdate, db: Session = Depends(get_db)):
    db_mark = crud_marks.get_mark(db, mark_id=mark_id)
    if not db_mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found.",
        )

    update_data = mark_update.model_dump(exclude_unset=True)

    if "week_number" in update_data:
        enabled_week = crud_enabled_weeks.get_enabled_week(db, update_data["week_number"])
        if not enabled_week:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This week is not enabled for participation marking.",
            )

    updated_mark = crud_marks.update_mark(db, db_mark=db_mark, update_data=update_data)
    return updated_mark


@router.delete("/{mark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mark(mark_id: int, db: Session = Depends(get_db)):
    mark = crud_marks.get_mark(db, mark_id=mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found.",
        )

    crud_marks.delete_mark(db, db_mark=mark)
    return None