from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class SystemConfigBase(BaseModel):
    """Shared properties across system configuration schemas."""
    coordinator_user_id: str = Field(..., max_length=50)
    max_weekly_score: int = Field(3, ge=0)
    total_participation_points: int = Field(0, ge=0)
    is_configured: bool = False
    week6_lock_enabled: bool = False
    week6_locked_at: Optional[datetime] = None
    week12_lock_enabled: bool = False
    week12_locked_at: Optional[datetime] = None
    updated_by_user_id: Optional[str] = Field(None, max_length=50)


#
# 2. HTTP POST (Create)
#
class SystemConfigCreate(SystemConfigBase):
    """Properties needed to create a system configuration."""
    pass


#
# 3. HTTP PUT / PATCH (Update)
#
class SystemConfigUpdate(BaseModel):
    """
    Properties that can be updated via API.
    All fields are optional to support partial updates.
    """
    coordinator_user_id: Optional[str] = Field(None, max_length=50)
    max_weekly_score: Optional[int] = Field(None, ge=0)
    total_participation_points: Optional[int] = Field(None, ge=0)
    is_configured: Optional[bool] = None
    week6_lock_enabled: Optional[bool] = None
    week6_locked_at: Optional[datetime] = None
    week12_lock_enabled: Optional[bool] = None
    week12_locked_at: Optional[datetime] = None
    updated_by_user_id: Optional[str] = Field(None, max_length=50)


#
# 4. Shared DB Properties
#
class SystemConfigInDBBase(SystemConfigBase):
    """Base schema for data returned from the database."""
    config_id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class SystemConfigResponse(SystemConfigInDBBase):
    """Schema used for API responses."""
    pass


#
# 6. Internal / DB Processing
#
class SystemConfigInDB(SystemConfigInDBBase):
    """Schema fully representing the database record internally."""
    pass