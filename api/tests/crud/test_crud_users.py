import pytest
from sqlalchemy.orm import Session
from partimark_app.models.users import UserRole # type: ignore
from partimark_app.crud.crud_users import create_user, get_user, get_user_by_email, get_users, update_user, delete_user # type: ignore
 
@pytest.fixture
def mock_user_data():
    """Fixture providing standard user data for creation."""
    return {
        "email": "test@example.com",
        "hashed_password": "supersecretpassword",
        "first_name": "Test",
        "last_name": "User",
        "preferred_name": "Tester",
        "display_name": "Test User",
        "role": UserRole.ADMIN,
        "is_active": True
    }

def test_create_user(db_session: Session, mock_user_data):
    """Test creating a new user."""
    user = create_user(db_session, mock_user_data)
    assert user.email == "test@example.com"
    assert user.first_name == "Test"
    assert user.user_id is not None

def test_get_user_by_email(db_session: Session, mock_user_data):
    """Test retrieving a user by email."""
    create_user(db_session, mock_user_data)
    user = get_user_by_email(db_session, "test@example.com")
    assert user is not None
    assert user.email == "test@example.com"

def test_get_user_by_email_not_found(db_session: Session):
    user = get_user_by_email(db_session, "nonexistent@example.com")
    assert user is None

def test_get_user(db_session: Session, mock_user_data):
    """Test retrieving a user by ID."""
    created_user = create_user(db_session, mock_user_data)
    user = get_user(db_session, created_user.user_id)
    assert user is not None
    assert user.user_id == created_user.user_id

def test_get_users(db_session: Session, mock_user_data):
    """Test retrieving multiple users."""
    create_user(db_session, mock_user_data)
    users = get_users(db_session)
    assert len(users) == 1

def test_update_user(db_session: Session, mock_user_data):
    """Test updating existing user fields."""
    user = create_user(db_session, mock_user_data)
    updated_user = update_user(db_session, user, {"first_name": "Updated"})
    assert updated_user.first_name == "Updated"
    assert updated_user.last_name == "User" # Unchanged field

def test_delete_user(db_session: Session, mock_user_data):
    """Test deleting a user."""
    user = create_user(db_session, mock_user_data)
    # Ensure they exist first
    assert get_user(db_session, user.user_id) is not None
    
    # Delete them
    delete_user(db_session, user)
    
    # Ensure they are gone
    fetched = get_user(db_session, user.user_id)
    assert fetched is None
