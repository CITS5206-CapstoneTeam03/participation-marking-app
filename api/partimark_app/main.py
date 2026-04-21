from fastapi import Depends, FastAPI, APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqladmin import Admin

from db.db import get_db, engine
from models.users import User
from admin.views import UserAdmin
from api_version.v1.api import api_router
from services.logic_app.logicApp import router as logic_router

# ==========================================
# 1. Swagger UI Metadata Best Practices
# ==========================================
description = """
Backend API for the Participation Marking Application. 

## Users
Operations related to user management, profiles, and administration.

## Authentication (Coming Soon)
Endpoints for login, JWT token generation, and secure session management.
"""

tags_metadata = [
    {
        "name": "Users",
        "description": "Manage user accounts, roles, and profiles. *Login logic handled separately.*",
    },
]

app = FastAPI(
    title="PartiMark Documentation",
    description=description,
    version="1.0.0",
    contact={
        "name": "System Administrator",
        "email": "admin@example.com",
    },
    openapi_tags=tags_metadata,
)
app.include_router(logic_router)

# Configure the Admin interface
admin = Admin(app, engine)



admin.add_view(UserAdmin)

router = APIRouter(prefix="/api")

@router.get("/")
def home():
    return {"message": "Backend Partimark is ready!"}

@router.get("/test")
def test():
    return {"status": "Online", "version": "1.0.0"}

@router.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    try:
        first_user = db.query(User).order_by(User.user_id.asc()).first()
        return {
            "ok": True,
            "connected": True,
            "firstRecord": None
            if first_user is None
            else {"id": first_user.user_id, "name": first_user.display_name or first_user.first_name, "email": first_user.email},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB test failed: {e}")

app.include_router(router)
app.include_router(api_router, prefix="/api")