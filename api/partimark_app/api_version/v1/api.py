from fastapi import APIRouter, Depends
from ...core.deps import get_current_user, get_non_admin_user #type: ignore
from .routes import ( #type: ignore
    users,
    workshops,
    students,
    marks,
    enabled_weeks,
    system_config,
    auth,
)

api_router = APIRouter()
secure_deps = [Depends(get_current_user)]
non_admin_deps = [Depends(get_non_admin_user)]

api_router.include_router(users.router, prefix="/users", tags=["Users"], dependencies=secure_deps)
api_router.include_router(workshops.router, prefix="/workshops", tags=["Workshops"], dependencies=secure_deps)
api_router.include_router(students.router, prefix="/students", tags=["Students"], dependencies=secure_deps)
api_router.include_router(marks.router, prefix="/marks", tags=["Marks"], dependencies=non_admin_deps)
api_router.include_router(enabled_weeks.router, prefix="/enabled-weeks", tags=["Enabled Weeks"], dependencies=secure_deps)
api_router.include_router(system_config.router, prefix="/system-config", tags=["System Config"], dependencies=secure_deps)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])