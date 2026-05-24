from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from partimark_app.core.config import settings
from partimark_app.crud import crud_users
from partimark_app.schemas.users import UserCreate
from partimark_app.models.users import UserRole

def init_db(db: Session) -> None:
    """
    Initialize the database and bootstrap the admin user if configured.
    """
    if settings.initial_admin_email and settings.initial_admin_password:
        user = crud_users.get_user_by_email(db, email=settings.initial_admin_email)
        if not user:
            # Initialize UserCreate with the raw password
            user_in = UserCreate(
                email=settings.initial_admin_email,
                password=settings.initial_admin_password,
                first_name="System",
                last_name="Admin",
                display_name="System Administrator",
                role=UserRole.ADMIN,
            )
            
            # Prepare data for the DB model: exclude raw password and include hashed_password
            user_data = user_in.model_dump(exclude={"password"})
            user_data["hashed_password"] = user_in.get_hashed_password()
            user_data["is_active"] = True
            
            try:
                crud_users.create_user(db, user_data=user_data)
                print(f"Admin user {settings.initial_admin_email} successfully bootstrapped.")
            except IntegrityError:
                db.rollback()
                print(f"Admin user {settings.initial_admin_email} was created by another worker. Skipping.")
        else:
            print(f"Admin user {settings.initial_admin_email} already exists. Skipping bootstrap.")
