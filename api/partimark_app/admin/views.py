import bcrypt
from fastapi import Request
from sqladmin import ModelView
from partimark_app.models import (
    User, Student, Workshop, EnabledWeek, SystemConfig, 
    StudentWorkshopMembership, ParticipationMark, AuditLog
)

class UserAdmin(ModelView, model=User):
    # These are the columns from the User model that will be shown in the table
    column_list = [User.user_id, User.email, User.first_name, User.last_name, User.role, User.is_active]
    icon = "fa-solid fa-user"

    async def on_model_change(self, data: dict, model: User, is_created: bool, request: Request) -> None:
        """Intercept the save action to hash the password before it goes into the DB."""
        if "hashed_password" in data and data["hashed_password"]:
            raw_pwd = data["hashed_password"]
            # Only hash it if it's not already a bcrypt hash (which starts with $2b$ or $2a$)
            if not raw_pwd.startswith("$2"):
                salt = bcrypt.gensalt()
                data["hashed_password"] = bcrypt.hashpw(raw_pwd.encode("utf-8"), salt).decode("utf-8")

class StudentAdmin(ModelView, model=Student):
    # If column_list is not specified, SQLAdmin automatically displays all columns
    icon = "fa-solid fa-graduation-cap"

class WorkshopAdmin(ModelView, model=Workshop):
    icon = "fa-solid fa-chalkboard-user"

class EnabledWeekAdmin(ModelView, model=EnabledWeek):
    icon = "fa-solid fa-calendar-check"

class SystemConfigAdmin(ModelView, model=SystemConfig):
    icon = "fa-solid fa-gear"

class StudentWorkshopMembershipAdmin(ModelView, model=StudentWorkshopMembership):
    name = "Workshop Membership"
    name_plural = "Workshop Memberships"
    icon = "fa-solid fa-users"

class ParticipationMarkAdmin(ModelView, model=ParticipationMark):
    name = "Participation Mark"
    name_plural = "Participation Marks"
    icon = "fa-solid fa-check-double"
    
    # Restrict permissions: Read-only access for admins
    can_create = False
    can_edit = False
    can_delete = False

class AuditLogAdmin(ModelView, model=AuditLog):
    icon = "fa-solid fa-clipboard-list"

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
