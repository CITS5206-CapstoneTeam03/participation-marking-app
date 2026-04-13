from sqladmin import ModelView
from models.users import User

class UserAdmin(ModelView, model=User):
    # These are the columns from the User model that will be shown in the table
    column_list = [User.user_id, User.email, User.first_name, User.last_name, User.role, User.is_active]
    #Other models go here
    
    # You can also add icons, change display names, configure search columns, etc.
    icon = "fa-solid fa-user"
