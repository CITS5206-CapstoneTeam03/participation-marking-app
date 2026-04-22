import pytest
from sqlalchemy.orm import Session
from partimark_app.crud.crud_workshops import ( #type: ignore
    create_workshop, 
    get_workshop, 
    get_workshop_by_name, 
    get_workshops, 
    update_workshop, 
    delete_workshop
) 

@pytest.fixture
def mock_workshop_data():
    """Fixture providing standard workshop data perfectly aligned with industry best practices for predictable testing."""
    return {
        "workshop_name": "COMM3003 - Seminar 1",
        "tutor_user_id": "mock_tutor_user_id",
        "is_active": True
    }

def test_create_workshop(db_session: Session, mock_workshop_data):
    """Test successful workshop creation."""
    workshop = create_workshop(db_session, workshop_data=mock_workshop_data)
    
    assert workshop.workshop_id is not None
    assert workshop.workshop_name == mock_workshop_data["workshop_name"]
    assert workshop.tutor_user_id == mock_workshop_data["tutor_user_id"]
    assert workshop.is_active is True

def test_get_workshop(db_session: Session, mock_workshop_data):
    """Test fetching a workshop by its DB-generated ID."""
    created_workshop = create_workshop(db_session, workshop_data=mock_workshop_data)
    
    # Successful fetch
    found_workshop = get_workshop(db_session, workshop_id=created_workshop.workshop_id)
    assert found_workshop is not None
    assert found_workshop.workshop_name == mock_workshop_data["workshop_name"]
    
    # Failing fetch
    not_found = get_workshop(db_session, workshop_id=999999)
    assert not_found is None

def test_get_workshop_by_name(db_session: Session, mock_workshop_data):
    """Test fetching a workshop by its unique name."""
    created_workshop = create_workshop(db_session, workshop_data=mock_workshop_data)
    
    found_workshop = get_workshop_by_name(db_session, workshop_name=mock_workshop_data["workshop_name"])
    assert found_workshop is not None
    assert found_workshop.workshop_id == created_workshop.workshop_id
    
    not_found = get_workshop_by_name(db_session, workshop_name="Non-existent Workshop")
    assert not_found is None

def test_get_workshops(db_session: Session, mock_workshop_data):
    """Test fetching a paginated list of workshops."""
    # Seed
    create_workshop(db_session, workshop_data=mock_workshop_data)
    
    # Seed secondary workshop manually to bypass UNIQUE constraint on workshop_name
    second_workshop = mock_workshop_data.copy()
    second_workshop["workshop_name"] = "COMM3003 - Seminar 2"
    create_workshop(db_session, workshop_data=second_workshop)
    
    workshops = get_workshops(db_session, skip=0, limit=10)
    assert len(workshops) >= 2

def test_update_workshop(db_session: Session, mock_workshop_data):
    """Test updating existing workshop records."""
    workshop = create_workshop(db_session, workshop_data=mock_workshop_data)
    
    update_data = {"workshop_name": "COMM3003 - Updated Seminar", "is_active": False}
    updated_workshop = update_workshop(db_session, db_workshop=workshop, update_data=update_data)
    
    assert updated_workshop.workshop_name == "COMM3003 - Updated Seminar"
    assert updated_workshop.tutor_user_id == mock_workshop_data["tutor_user_id"] # Remains unchanged
    assert updated_workshop.is_active is False

def test_delete_workshop(db_session: Session, mock_workshop_data):
    """Test purging a workshop from the database."""
    workshop = create_workshop(db_session, workshop_data=mock_workshop_data)
    
    # Verify it exists
    assert get_workshop(db_session, workshop_id=workshop.workshop_id) is not None
    
    # Delete it
    delete_workshop(db_session, db_workshop=workshop)
    
    # Verify thoroughly obliterated
    assert get_workshop(db_session, workshop_id=workshop.workshop_id) is None
