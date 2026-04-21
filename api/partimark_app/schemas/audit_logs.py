from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class AuditLogBase(BaseModel):
    """Shared properties across audit log schemas."""
    user_id: str = Field(..., max_length=50)
    student_id: Optional[str] = Field(None, max_length=20)
    workshop_id: Optional[int] = None
    week_number: Optional[int] = Field(None, ge=1, le=12)
    action_type: str = Field(..., max_length=50)
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: str


#
# 2. HTTP POST (Create)
#
class AuditLogCreate(AuditLogBase):
    """Properties needed to create an audit log entry."""
    pass


#
# 3. Shared DB Properties
#
class AuditLogInDBBase(AuditLogBase):
    """Base schema for data returned from the database."""
    audit_log_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#
# 4. HTTP GET (Response)
#
class AuditLogResponse(AuditLogInDBBase):
    """Schema used for API responses."""
    pass


#
# 5. Internal / DB Processing
#
class AuditLogInDB(AuditLogInDBBase):
    """Schema fully representing the database record internally."""
    pass