from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from partimark_app.core.config import settings
from partimark_app.db.db import SessionLocal
from partimark_app.crud import crud_users
from partimark_app.core.security import verify_password
from partimark_app.models.users import UserRole

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form["username"], form["password"]

        with SessionLocal() as db:
            user = crud_users.get_user_by_email(db, email=username)
            if not user:
                return False
            if not verify_password(password, user.hashed_password):
                return False
            if user.role != UserRole.ADMIN:
                return False

        # Session securely handled by SQLAdmin under the hood using secret_key
        request.session.update({"token": user.user_id})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False

        # Optionally check if user still exists/is admin
        with SessionLocal() as db:
            user = crud_users.get_user(db, user_id=token)
            if not user or user.role != UserRole.ADMIN:
                return False

        return True

authentication_backend = AdminAuth(secret_key=settings.paseto_secret_key)
