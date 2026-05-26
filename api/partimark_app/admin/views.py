import logging
import secrets

import bcrypt
from fastapi import Request
from sqladmin import ModelView, action
from starlette.responses import RedirectResponse
from partimark_app.models import (
    User, Student, Workshop, EnabledWeek, SystemConfig, 
    StudentWorkshopMembership, ParticipationMark, AuditLog
)
from partimark_app.services.email.register import (
    generate_set_password_token,
    send_welcome_set_password_email,
    send_password_reset_email,
)
from partimark_app.crud.crud_users import set_reset_token, get_user_by_email, get_user
from partimark_app.db.db import SessionLocal
from typing import Any
from partimark_app.crud import (
    crud_users,
    crud_students,
    crud_workshops,
    crud_student_workshop_memberships,
)
from partimark_app.services.email.mark_publish import draft_and_send_emails

logger = logging.getLogger(__name__)


class UserAdmin(ModelView, model=User):
    # These are the columns from the User model that will be shown in the table
    column_list = [User.user_id, User.email, User.first_name, User.last_name, User.role, User.is_active]
    icon = "fa-solid fa-user"

    async def insert_model(self, request: Request, data: dict) -> Any:
        await self.on_model_change(data, model=None, is_created=True, request=request)
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = crud_users.create_user(db, user_data=data, user_id=admin_id)
        
        await self.after_model_change(data, model, is_created=True, request=request)
        return model

    async def update_model(self, request: Request, pk: str, data: dict) -> Any:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                await self.on_model_change(data, model, is_created=False, request=request)
                updated_model = crud_users.update_user(db, db_user=model, update_data=data, user_id=admin_id)
                await self.after_model_change(data, updated_model, is_created=False, request=request)
                return updated_model
            return None

    async def delete_model(self, request: Request, pk: Any) -> None:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                crud_users.delete_user(db, db_user=model, user_id=admin_id)

    # Exclude auto-managed fields from the create/edit form.
    # - created_at / updated_at: set by the DB server default and onupdate triggers
    # - password_reset_token_*: managed programmatically by the email service
    form_excluded_columns = [
        "created_at",
        "updated_at",
        "password_reset_token_hash",
        "password_reset_token_expires_at",
        "marks_given",
        "workshops_tutored",
        "coordinated_configs",
        "updated_configs",
        "memberships_created",
        "audit_logs",
        "hashed_password",
    ]

    async def on_model_change(self, data: dict, model: User, is_created: bool, request: Request) -> None:
        """Intercept save to auto-generate a placeholder password on create and validate email on edit."""
        # On create: generate a secure random placeholder password.
        # The user will replace this via the activation email link — it is never directly usable.
        if is_created:
            random_bytes = secrets.token_bytes(32)
            data["hashed_password"] = bcrypt.hashpw(random_bytes, bcrypt.gensalt()).decode("utf-8")

        # On edit: check that the new email isn't already taken by another user
        if not is_created and "email" in data:
            new_email = data["email"]
            if new_email and new_email != model.email:
                db = SessionLocal()
                try:
                    existing = get_user_by_email(db, email=new_email)
                    if existing:
                        raise ValueError(f"Email '{new_email}' is already in use by another account.")
                finally:
                    db.close()

        # On edit: profile fields are user-owned (set via the activation form).
        # Restore original values so admin changes are silently discarded.
        _PROFILE_FIELDS = ("first_name", "last_name", "preferred_name", "display_name")
        if not is_created:
            for field in _PROFILE_FIELDS:
                if field in data:
                    data[field] = getattr(model, field, data[field])

        # On edit: prevent admin from manually activating an account.
        # is_active=True may only be set by the set-password activation flow (auth.py).
        # Admins CAN deactivate (True → False) to suspend an account.
        if not is_created and data.get("is_active") is True and not model.is_active:
            raise ValueError(
                "Cannot manually activate this account. "
                "Use the 'Resend Welcome Email' or 'Send Password Reset' action to send the user "
                "an activation link — the account activates automatically when they set their password."
            )

    async def after_model_change(self, data: dict, model: User, is_created: bool, request: Request) -> None:
        """After a new user is saved, generate a set-password token and send a welcome email."""
        if not is_created:
            return  # Only fire on creation, not edits

        # Open a fresh session — the sqladmin session may already be closed at this point
        db = SessionLocal()
        try:
            user = get_user_by_email(db, email=model.email)
            if not user:
                logger.error(f"after_model_change: could not find user {model.email} to send welcome email")
                return

            raw_token, token_hash, expires_at = generate_set_password_token()
            set_reset_token(db, user, token_hash, expires_at)

            send_welcome_set_password_email(
                user_email=user.email,
                user_display_name=user.display_name,
                raw_token=raw_token,
            )
        except Exception as e:
            logger.error(f"Welcome email failed for {model.email}: {e}")
        finally:
            db.close()

    @action(
        name="resend_welcome",
        label="Resend Welcome Email",
        confirmation_message="Send a fresh set-password link to the selected user(s)?",
        add_in_detail=True,
        add_in_list=True,
    )
    async def resend_welcome_action(self, request: Request):
        """
        Admin panel action: resend the welcome set-password email to selected user(s).
        Replaces any existing stale token with a fresh 24-hour one.
        """
        pks = request.query_params.get("pks", "").split(",")
        db = SessionLocal()
        try:
            for pk in pks:
                pk = pk.strip()
                if not pk:
                    continue
                user = get_user(db, user_id=pk)
                if not user:
                    logger.warning(f"resend_welcome_action: user {pk} not found")
                    continue
                raw_token, token_hash, expires_at = generate_set_password_token()
                set_reset_token(db, user, token_hash, expires_at)
                send_welcome_set_password_email(
                    user_email=user.email,
                    user_display_name=user.display_name,
                    raw_token=raw_token,
                )
                logger.info(f"Welcome email resent to {user.email}")
        except Exception as e:
            logger.error(f"resend_welcome_action failed: {e}")
        finally:
            db.close()
        return RedirectResponse(request.url_for("admin:list", identity="user"), status_code=302)

    @action(
        name="send_password_reset",
        label="Send Password Reset",
        confirmation_message="Send a password-reset email to the selected user(s)?",
        add_in_detail=True,
        add_in_list=True,
    )
    async def send_password_reset_action(self, request: Request):
        """
        Admin panel action: send a password-reset email to selected user(s).
        Only fires for active accounts.
        """
        pks = request.query_params.get("pks", "").split(",")
        db = SessionLocal()
        try:
            for pk in pks:
                pk = pk.strip()
                if not pk:
                    continue
                user = get_user(db, user_id=pk)
                if not user:
                    logger.warning(f"send_password_reset_action: user {pk} not found")
                    continue
                if not user.is_active:
                    logger.warning(f"send_password_reset_action: skipping inactive user {user.email}")
                    continue
                raw_token, token_hash, expires_at = generate_set_password_token()
                set_reset_token(db, user, token_hash, expires_at)
                send_password_reset_email(
                    user_email=user.email,
                    user_display_name=user.display_name,
                    raw_token=raw_token,
                )
                logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            logger.error(f"send_password_reset_action failed: {e}")
        finally:
            db.close()
        return RedirectResponse(request.url_for("admin:list", identity="user"), status_code=302)


class StudentAdmin(ModelView, model=Student):
    # If column_list is not specified, SQLAdmin automatically displays all columns
    column_list = [Student.student_id,Student.created_at]
    icon = "fa-solid fa-graduation-cap"

    form_excluded_columns = [
        "created_at",
        "updated_at",
        "participation_marks",
        "workshop_memberships",
        "audit_logs",
    ]

    async def insert_model(self, request: Request, data: dict) -> Any:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            return crud_students.create_student(db, student_data=data, user_id=admin_id)

    async def update_model(self, request: Request, pk: str, data: dict) -> Any:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                return crud_students.update_student(db, db_student=model, update_data=data, user_id=admin_id)
            return None

    async def delete_model(self, request: Request, pk: Any) -> None:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                crud_students.delete_student(db, db_student=model, user_id=admin_id)

class WorkshopAdmin(ModelView, model=Workshop):
    column_list = [Workshop.workshop_name, Workshop.tutor, "tutor_email", "tutor_name", Workshop.tutor_user_id]
    icon = "fa-solid fa-chalkboard-user"

    form_excluded_columns = [
        "created_at",
        "updated_at",
        "participation_marks",
        "student_memberships",
        "audit_logs",
    ]

    def _normalize_data(self, data: dict) -> None:
        if "tutor" in data:
            data["tutor_user_id"] = data.pop("tutor")

    async def insert_model(self, request: Request, data: dict) -> Any:
        self._normalize_data(data)
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            return crud_workshops.create_workshop(db, workshop_data=data, user_id=admin_id)

    async def update_model(self, request: Request, pk: str, data: dict) -> Any:
        self._normalize_data(data)
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                return crud_workshops.update_workshop(db, db_workshop=model, update_data=data, user_id=admin_id)
            return None

    async def delete_model(self, request: Request, pk: Any) -> None:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                crud_workshops.delete_workshop(db, db_workshop=model, user_id=admin_id)

class EnabledWeekAdmin(ModelView, model=EnabledWeek):
    column_list = [EnabledWeek.week_number, EnabledWeek.created_at]
    icon = "fa-solid fa-calendar-check"
    can_create = False
    can_edit = False
    can_delete = False

class SystemConfigAdmin(ModelView, model=SystemConfig):
    column_list = [SystemConfig.coordinator_user, SystemConfig.week12_lock_enabled, SystemConfig.week6_lock_enabled, SystemConfig.total_participation_points]
    icon = "fa-solid fa-gear"
    can_create = False
    can_edit = False
    can_delete = False
class StudentWorkshopMembershipAdmin(ModelView, model=StudentWorkshopMembership):
    column_list = [StudentWorkshopMembership.workshop_id, StudentWorkshopMembership.student_id, StudentWorkshopMembership.created_by_user_id, StudentWorkshopMembership.student, StudentWorkshopMembership.workshop]
    name = "Workshop Membership"
    name_plural = "Workshop Memberships"
    icon = "fa-solid fa-users"

    def _normalize_data(self, data: dict) -> None:
        if "student" in data:
            data["student_id"] = data.pop("student")
        if "workshop" in data:
            data["workshop_id"] = data.pop("workshop")
        if "created_by_user" in data:
            data["created_by_user_id"] = data.pop("created_by_user")

    async def insert_model(self, request: Request, data: dict) -> Any:
        self._normalize_data(data)
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            return crud_student_workshop_memberships.create_membership(db, membership_data=data, user_id=admin_id)

    async def update_model(self, request: Request, pk: str, data: dict) -> Any:
        self._normalize_data(data)
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                return crud_student_workshop_memberships.update_membership(db, db_membership=model, update_data=data, user_id=admin_id)
            return None

    async def delete_model(self, request: Request, pk: Any) -> None:
        admin_id = request.session.get("token")
        with SessionLocal() as db:
            model = db.get(self.model, pk)
            if model:
                crud_student_workshop_memberships.delete_membership(db, db_membership=model, user_id=admin_id)

class ParticipationMarkAdmin(ModelView, model=ParticipationMark):
    name = "Participation Mark"
    name_plural = "Participation Marks"
    icon = "fa-solid fa-check-double"
    column_list = [ParticipationMark.student_id, ParticipationMark.score, ParticipationMark.marked_by_user_id, ParticipationMark.marked_at, ParticipationMark.updated_at, ParticipationMark.enabled_week]
    
    @action(
        name="publish_half_sem",
        label="Publish Mid-Semester Marks",
        confirmation_message="Are you sure you want to publish Mid-Semester marks to all students?",
        add_in_detail=True,
        add_in_list=True,
    )
    async def publish_half_sem_action(self, request: Request):
        db = SessionLocal()
        try:
            sent_count = draft_and_send_emails(db=db, final=False)
            logger.info(f"publish_half_sem_action: Successfully sent {sent_count} mid-semester emails.")
        except Exception as e:
            logger.error(f"publish_half_sem_action failed: {e}")
        finally:
            db.close()
        return RedirectResponse(request.url_for("admin:list", identity="participation-mark"), status_code=302)

    @action(
        name="publish_last_sem",
        label="Publish Final Semester Marks",
        confirmation_message="Are you sure you want to publish Final Semester marks to all students?",
        add_in_detail=True,
        add_in_list=True,
    )
    async def publish_last_sem_action(self, request: Request):
        db = SessionLocal()
        try:
            sent_count = draft_and_send_emails(db=db, final=True)
            logger.info(f"publish_last_sem_action: Successfully sent {sent_count} final semester emails.")
        except Exception as e:
            logger.error(f"publish_last_sem_action failed: {e}")
        finally:
            db.close()
        return RedirectResponse(request.url_for("admin:list", identity="participation-mark"), status_code=302)

    # Restrict permissions: Read-only access for admins
    can_create = False
    can_edit = False
    can_delete = False

class AuditLogAdmin(ModelView, model=AuditLog):
    column_list = [AuditLog.action_type, AuditLog.user_id, AuditLog.created_at, AuditLog.description]
    icon = "fa-solid fa-clipboard-list"

    # Restrict permissions: Read-only access for admins
    can_create = False
    can_edit = False
    can_delete = False

# List of all views to easily add to admin in main.py
all_admin_views = [
    UserAdmin,
    StudentAdmin,
    WorkshopAdmin,
    EnabledWeekAdmin,
    SystemConfigAdmin,
    StudentWorkshopMembershipAdmin,
    ParticipationMarkAdmin,
    AuditLogAdmin
]
