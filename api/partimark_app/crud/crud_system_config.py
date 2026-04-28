from typing import Optional

from sqlalchemy.orm import Session

from ..models.system_config import SystemConfig
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate

#TO DO: update user ID when merge PR, retrieve user_id from auth payload

actions = [
    "config_sys",
    "modify_config",
    "delete_config"
]

def get_system_config(db: Session, config_id: int) -> Optional[SystemConfig]:
    """Retrieve system configuration by config_id."""
    return (
        db.query(SystemConfig)
        .filter(SystemConfig.config_id == config_id)
        .first()
    )


def get_current_system_config(db: Session) -> Optional[SystemConfig]:
    """
    Retrieve the current system configuration.

    Schema V3 assumes the table should contain a single row for the current semester setup.
    """
    return db.query(SystemConfig).order_by(SystemConfig.config_id.asc()).first()


def create_system_config(db: Session, config_data: dict) -> SystemConfig:
    """Create a system configuration row."""
    new_config = SystemConfig(**config_data)

    audit_in = AuditLogCreate(
        user_id=new_config.coordinator_user_id,
        action_type=actions[0],
        description="Configured system settings"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config


def update_system_config(
    db: Session,
    db_config: SystemConfig,
    update_data: dict,
) -> SystemConfig:
    """Update an existing system configuration row."""
    audit_in = AuditLogCreate(
        user_id=update_data.get("updated_by_user_id") or db_config.coordinator_user_id,
        action_type=actions[1],
        description="Modified system configuration"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for key, value in update_data.items():
        if value is not None:
            setattr(db_config, key, value)
    db.commit()
    db.refresh(db_config)
    return db_config


def upsert_current_system_config(db: Session, config_data: dict) -> SystemConfig:
    """
    Create the current config if it does not exist, otherwise update it.

    Useful because Schema V3 expects only one current-semester config row.
    """
    db_config = get_current_system_config(db)
    if db_config is None:
        return create_system_config(db, config_data)
    return update_system_config(db, db_config, config_data)


def delete_system_config(db: Session, db_config: SystemConfig) -> None:
    """Delete a system configuration row."""
    audit_in = AuditLogCreate(
        user_id=db_config.coordinator_user_id,
        action_type=actions[2],
        description="Deleted system configuration"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_config)
    db.commit()
