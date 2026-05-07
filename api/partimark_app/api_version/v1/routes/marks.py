from api.partimark_app.models import StudentStatus
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.marks import MarkCreate, MarkResponse, MarkUpdate, MarkBatchRequest, MarkBatchRequestItem #type:ignore
from ....crud import crud_marks as crud_marks #type:ignore
from ....crud import crud_enabled_weeks as crud_enabled_weeks #type:ignore
from ....crud import crud_system_config as crud_system_config #type:ignore
from ....services import csv_export #type:ignore
from ....core.deps import get_non_admin_user #type: ignore
from ....models.users import User #type: ignore
from ....services.csv import csv_export, csv_import #type: ignore
from ....crud import crud_students as crud_students #type: ignore
from ....crud.csv_export import calculate_total_and_percent_mark, calculate_w6_total_and_percent_mark #type: ignore

router = APIRouter()


@router.post("/", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def create_mark(
    mark_in: MarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_non_admin_user),
):
    # check week 6 & 12 lock
    if crud_system_config.is_week6_lock_enabled(db) and mark_in.week_number <= 6:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 6 is currently locked.",
        )
    
    if crud_system_config.is_week12_lock_enabled(db) and 6 < mark_in.week_number <= 12:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 12 is currently locked.",
        )

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
    mark_data["marked_by_user_id"] = current_user.user_id
    new_mark = crud_marks.create_mark(db, mark_data=mark_data)
    return new_mark


@router.post("/workshop/{workshop_id}/week/{week_number}/batch", response_model=List[MarkResponse], status_code=status.HTTP_201_CREATED)
def batch_create_workshop_marks(
    workshop_id: int,
    week_number: int,
    marks_in: MarkBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_non_admin_user),
):
    # check week 6 & 12 lock
    if crud_system_config.is_week6_lock_enabled(db) and week_number <= 6:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 6 is currently locked.",
        )
    
    if crud_system_config.is_week12_lock_enabled(db) and 6 < week_number <= 12:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 12 is currently locked.",
        )

    #check if marks array is empty
    if not marks_in.marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one mark is required for batch creation.",
        )

    #check if the week is enabled
    enabled_week = crud_enabled_weeks.get_enabled_week(db, week_number)
    if not enabled_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This week is not enabled for participation marking.",
        )

    #check if all marks in the batch are for different students
    student_ids = [mark.student_id for mark in marks_in.marks]
    if len(student_ids) != len(set(student_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch create must contain one mark per student.",
        )

    #check if marks already exist for any of the students
    existing_marks = crud_marks.get_marks_by_workshop_and_week(db, workshop_id, week_number)
    existing_student_ids = {mark.student_id for mark in existing_marks}
    duplicate_student_ids = sorted(existing_student_ids.intersection(student_ids))
    if duplicate_student_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marks already exist for student(s): {', '.join(duplicate_student_ids)}.",
        )

    marks_data = [
        {
            "student_id": mark.student_id,
            "workshop_id": workshop_id,
            "week_number": week_number,
            "score": mark.score,
            "marked_by_user_id": current_user.user_id,
        }
        for mark in marks_in.marks
    ]
    new_marks = crud_marks.batch_create_marks(db, marks_data=marks_data)
    return new_marks


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

@router.post("/export/half_semester")
async def export_half_semester_grades(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    marks = calculate_w6_total_and_percent_mark(db)
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


@router.put("/workshop/{workshop_id}/week/{week_number}/batch", response_model=List[MarkResponse])
def batch_update_workshop_marks(
    workshop_id: int,
    week_number: int,
    marks_in: MarkBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_non_admin_user),
):
    if crud_system_config.is_week6_lock_enabled(db) and week_number <= 6:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 6 is currently locked.",
        )
    
    if crud_system_config.is_week12_lock_enabled(db) and 6 < week_number <= 12:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 12 is currently locked.",
        )

    if not marks_in.marks:
        return []

    enabled_week = crud_enabled_weeks.get_enabled_week(db, week_number)
    if not enabled_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This week is not enabled for participation marking.",
        )

    existing_marks = crud_marks.get_marks_by_workshop_and_week(
        db,
        workshop_id=workshop_id,
        week_number=week_number,
    )

    if not existing_marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existing marks found for workshop {workshop_id} in week {week_number}.",
        )

    updates_data = [
        {
            "student_id": mark.student_id,
            "score": mark.score,
            "marked_by_user_id": current_user.user_id,
            "week_number": week_number,
        }
        for mark in marks_in.marks
    ]

    updated_records = crud_marks.batch_update_marks(
        db=db,
        workshop_id=workshop_id,
        existing_marks=existing_marks,
        updates_data=updates_data,
    )

    return updated_records


@router.patch("/{mark_id}", response_model=MarkResponse)
def update_mark(
    mark_id: int,
    mark_update: MarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_non_admin_user),
):
    db_mark = crud_marks.get_mark(db, mark_id=mark_id)
    if not db_mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found.",
        )

    # check week 6 & 12 lock for current data
    if crud_system_config.is_week6_lock_enabled(db) and db_mark.week_number <= 6:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 6 is currently locked.",
        )
    
    if crud_system_config.is_week12_lock_enabled(db) and 6 < db_mark.week_number <= 12:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 12 is currently locked.",
        )

    update_data = mark_update.model_dump(exclude_unset=True)
    update_data["marked_by_user_id"] = current_user.user_id
    if update_data.get("week_number"):
        # check week 6 & 12 lock for update data
        if crud_system_config.is_week6_lock_enabled(db) and update_data.get("week_number") <= 6:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Updating marks for Week 6 is currently locked.",
            )
        
        if crud_system_config.is_week12_lock_enabled(db) and 6 < update_data.get("week_number") <= 12:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Updating marks for Week 12 is currently locked.",
            )

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

    # check week 6 & 12 lock for current data
    if crud_system_config.is_week6_lock_enabled(db) and mark.week_number <= 6:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 6 is currently locked.",
        )
    
    if crud_system_config.is_week12_lock_enabled(db) and 6 < mark.week_number <= 12:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updating marks for Week 12 is currently locked.",
        )    

    crud_marks.delete_mark(db, db_mark=mark)
    return None