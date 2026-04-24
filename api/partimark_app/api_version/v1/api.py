from fastapi import APIRouter
from .routes import (
    users,
    workshops,
    students,
    marks,
    enabled_weeks,
    system_config,
)

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(workshops.router, prefix="/workshops", tags=["Workshops"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(marks.router, prefix="/marks", tags=["Marks"])
api_router.include_router(enabled_weeks.router, prefix="/enabled-weeks", tags=["Enabled Weeks"])
api_router.include_router(system_config.router, prefix="/system-config", tags=["System Config"])