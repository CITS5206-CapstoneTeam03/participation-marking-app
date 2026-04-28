from typing import Optional

from sqlalchemy.orm import Session

from ..models.system_config import SystemConfig
from ..schemas.system_config import SystemConfigCreate, SystemConfigUpdate
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate

#TO DO: update user ID when merge PR, retrieve user_id from auth payload

actions = [
    "config_sys",
    "modify_config",
    "delete_config"
]

def get_system_config(db: Session) -> Optional[SystemConfig]:
    """
    Current-semester-only design:
    this table is expected to contain a single row.
    """
    return db.query(SystemConfig).order_by(SystemConfig.config_id.asc()).first()


def get_system_config_by_id(db: Session, config_id: int) -> Optional[SystemConfig]:
    return db.query(SystemConfig).filter(SystemConfig.config_id == config_id).first()


def create_system_config(db: Session, config_in: SystemConfigCreate) -> SystemConfig:
    db_config = SystemConfig(
        coordinator_user_id=config_in.coordinator_user_id,
        max_weekly_score=config_in.max_weekly_score,
        total_participation_points=config_in.total_participation_points,
        is_configured=config_in.is_configured,
        week6_lock_enabled=config_in.week6_lock_enabled,
        week6_locked_at=config_in.week6_locked_at,
        week12_lock_enabled=config_in.week12_lock_enabled,
        week12_locked_at=config_in.week12_locked_at,
        updated_by_user_id=config_in.updated_by_user_id,
    )

    audit_in = AuditLogCreate(
        user_id=db_config.coordinator_user_id,
        action_type=actions[0],
        description="Configured system settings"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def update_system_config(
    db: Session,
    db_config: SystemConfig,
    config_in: SystemConfigUpdate,
) -> SystemConfig:
    update_data = config_in.model_dump(exclude_unset=True)

    audit_in = AuditLogCreate(
        user_id=update_data.get("updated_by_user_id") or db_config.coordinator_user_id,
        action_type=actions[1],
        description="Modified system configuration"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for field, value in update_data.items():
        setattr(db_config, field, value)

    db.commit()
    db.refresh(db_config)
    return db_config


def upsert_system_config(
    db: Session,
    config_in: SystemConfigCreate,
) -> SystemConfig:
    existing_config = get_system_config(db)

    if existing_config:
        update_data = config_in.model_dump(exclude_unset=False)

        audit_in = AuditLogCreate(
            user_id=config_in.updated_by_user_id or existing_config.coordinator_user_id,
            action_type=actions[1],
            description="Modified system configuration via upsert"
        )
        create_audit_log(db, log_data=audit_in.model_dump())

        for field, value in update_data.items():
            setattr(existing_config, field, value)

        db.commit()
        db.refresh(existing_config)
        return existing_config

    return create_system_config(db, config_in)