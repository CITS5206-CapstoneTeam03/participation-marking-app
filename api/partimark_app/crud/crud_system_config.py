from typing import Optional

from sqlalchemy.orm import Session

from ..models.system_config import SystemConfig

#TO DO: Refactor to extract the user's role from session-based or token-based (PASETO/JWT) authentication, and use that role to determine access permissions for these CRUD operations.

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


def is_week6_lock_enabled(db: Session) -> bool:
    """Return whether the Week 6 lock is enabled for the current config."""
    db_config = get_current_system_config(db)
    if db_config is None:
        return False
    return bool(db_config.week6_lock_enabled)


def is_week12_lock_enabled(db: Session) -> bool:
    """Return whether the Week 12 lock is enabled for the current config."""
    db_config = get_current_system_config(db)
    if db_config is None:
        return False
    return bool(db_config.week12_lock_enabled)


def create_system_config(db: Session, config_data: dict) -> SystemConfig:
    """Create a system configuration row."""
    new_config = SystemConfig(**config_data)
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
    db.delete(db_config)
    db.commit()