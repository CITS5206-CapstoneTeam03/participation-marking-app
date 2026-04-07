from fastapi import Depends, FastAPI, APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqladmin import Admin, ModelView

from db import get_db, engine
from models.users import User

app = FastAPI()

# Configure the Admin interface
admin = Admin(app, engine)

# Add an Admin view for the User model
class UserAdmin(ModelView, model=User):
    # These are the columns from the User model that will be shown in the table
    column_list = [User.user_id, User.email, User.first_name, User.last_name, User.role, User.is_active]
    
    # You can also add icons, change display names, configure search columns, etc.
    icon = "fa-solid fa-user"

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