from fastapi import APIRouter
from api_version.v1.routes import users, workshops

# Implement a "Super Router" for v1
# All granular routers (like users, auth, etc.) will be attached to this single router.
api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(workshops.router, prefix="/workshops", tags=["Workshops"])
