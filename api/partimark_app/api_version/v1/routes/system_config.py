from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.system_config import ( #type:ignore
    SystemConfigCreate,
    SystemConfigResponse,
    SystemConfigUpdate,
)
from ....crud import crud_system_config as crud  # type: ignore
from ....crud import crud_users as crud_users  # type: ignore
from ....core.deps import get_current_user # type: ignore
from ....models.users import User, UserRole # type: ignore

router = APIRouter()


@router.get("/current", response_model=SystemConfigResponse)
def get_current_system_config(db: Session = Depends(get_db)):
    db_config = crud.get_current_system_config(db)
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="System configuration not found.",
        )
    return db_config


@router.post("/", response_model=SystemConfigResponse, status_code=status.HTTP_201_CREATED)
def create_system_config(
    config_in: SystemConfigCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.UC:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Unit Coordinators (UC) can modify system configurations.",
        )

    existing_config = crud.get_current_system_config(db)
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System configuration already exists. Use PATCH /current instead.",
        )

    coordinator = crud_users.get_user(db, config_in.coordinator_user_id)
    if not coordinator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinator user does not exist.",
        )

    if config_in.updated_by_user_id:
        updated_by_user = crud_users.get_user(db, config_in.updated_by_user_id)
        if not updated_by_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="updated_by_user_id does not exist.",
            )

    config_data = config_in.model_dump()
    new_config = crud.create_system_config(db, config_data=config_data, user_id=current_user.user_id)
    return new_config


@router.patch("/current", response_model=SystemConfigResponse)
def update_current_system_config(
    config_update: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.UC:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Unit Coordinators (UC) can modify system configurations.",
        )

    db_config = crud.get_current_system_config(db)
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="System configuration not found.",
        )

    update_data = config_update.model_dump(exclude_unset=True)

    if "coordinator_user_id" in update_data:
        coordinator = crud_users.get_user(db, update_data["coordinator_user_id"])
        if not coordinator:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordinator user does not exist.",
            )

    if "updated_by_user_id" in update_data and update_data["updated_by_user_id"] is not None:
        updated_by_user = crud_users.get_user(db, update_data["updated_by_user_id"])
        if not updated_by_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="updated_by_user_id does not exist.",
            )

    updated_config = crud.update_system_config(
        db,
        db_config=db_config,
        update_data=update_data,
        user_id=current_user.user_id,
    )
    return updated_config