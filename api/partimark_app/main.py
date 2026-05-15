from fastapi import Depends, FastAPI, APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqladmin import Admin
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from partimark_app.db.init_db import init_db
from partimark_app.db.db import get_db, engine, SessionLocal
from partimark_app.models.users import User
from partimark_app.admin.views import all_admin_views
from partimark_app.api_version.v1.api import api_router
from partimark_app.services.logic_app.logicApp import router as logic_router
from partimark_app.admin.auth import authentication_backend
from partimark_app.core.config import settings

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    with SessionLocal() as db:
        init_db(db)
    yield

app = FastAPI(
    title="PartiMark Documentation",
    description=description,
    version="1.0.0",
    contact={
        "name": "System Administrator",
        "email": "admin@example.com",
    },
    openapi_tags=tags_metadata,
    lifespan=lifespan,
)

app.include_router(logic_router)

if settings.admin_url:
    # Configure the Admin interface to be served under admin_url
    # This ensures Azure Static Web Apps automatically proxies traffic to it.
    admin = Admin(app, engine, base_url=settings.admin_url, authentication_backend=authentication_backend)

    for view in all_admin_views:
        admin.add_view(view)
else:
    logger.warning("Admin URL is not set. Admin interface will not be available.")

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