from fastapi import APIRouter, Depends
from ...core.deps import get_current_user, get_non_admin_user #type: ignore
from ...models.users import User #type: ignore
from ...schemas.users import UserResponse #type: ignore
from .routes import ( #type: ignore
    users,
    workshops,
    students,
    marks,
    enabled_weeks,
    system_config,
    auth,
    notifications,
)

api_router = APIRouter()
secure_deps = [Depends(get_current_user)]
non_admin_deps = [Depends(get_non_admin_user)]

@api_router.get("/me", response_model=UserResponse, summary="Get your own profile")
def get_own_profile(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return current_user

api_router.include_router(users.router, prefix="/users", tags=["Users"], dependencies=secure_deps)
api_router.include_router(workshops.router, prefix="/workshops", tags=["Workshops"], dependencies=secure_deps)
api_router.include_router(students.router, prefix="/students", tags=["Students"], dependencies=secure_deps)
api_router.include_router(marks.router, prefix="/marks", tags=["Marks"], dependencies=non_admin_deps)
api_router.include_router(enabled_weeks.router, prefix="/enabled-weeks", tags=["Enabled Weeks"], dependencies=secure_deps)
api_router.include_router(system_config.router, prefix="/system-config", tags=["System Config"], dependencies=secure_deps)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"], dependencies=secure_deps)
