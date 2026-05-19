from fastapi import Depends, FastAPI, APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqladmin import Admin

from partimark_app.core.config import settings
from partimark_app.db.db import get_db, engine
from partimark_app.models.users import User
from partimark_app.admin.views import all_admin_views
from partimark_app.api_version.v1.api import api_router
from partimark_app.services.logic_app.logicApp import router as logic_router


class PublicAdminUrlMiddleware:
    def __init__(self, app, host: str, scheme: str) -> None:
        self.app = app
        self.host = host
        self.scheme = scheme

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope.get("path", "").startswith("/api/admin"):
            headers = [
                (name, value)
                for name, value in scope.get("headers", [])
                if name.lower() != b"host"
            ]
            headers.append((b"host", self.host.encode("latin-1")))

            scope = dict(scope)
            scope["scheme"] = self.scheme
            scope["server"] = (self.host, 443 if self.scheme == "https" else 80)
            scope["headers"] = headers

        await self.app(scope, receive, send)

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

app.add_middleware(
    PublicAdminUrlMiddleware,
    host=settings.public_app_host,
    scheme=settings.public_app_scheme,
)

app.include_router(logic_router)

# Configure the Admin interface under /api so Azure Static Web Apps proxies it.
admin = Admin(app, engine, base_url="/api/admin")

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
