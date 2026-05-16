from fastapi import Depends, FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqladmin import Admin
from pathlib import Path

from partimark_app.db.db import get_db, engine
from partimark_app.models.users import User
from partimark_app.admin.views import all_admin_views
from partimark_app.api_version.v1.api import api_router
from partimark_app.services.logic_app.logicApp import router as logic_router

STATIC_DIR = Path(__file__).resolve().parent / "static"

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

# Serve the static folder (reset_password.html etc.)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Public route: email links point here → serves the set-password HTML page
@app.get("/reset-password", include_in_schema=False)
def reset_password_page():
    return FileResponse(str(STATIC_DIR / "reset_password.html"))

# Configure the Admin interface
admin = Admin(app, engine)

for view in all_admin_views:
    admin.add_view(view)

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