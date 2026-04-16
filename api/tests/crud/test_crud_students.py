import pytest
from sqlalchemy.orm import Session
from crud.crud_students import ( #type: ignore
    create_student, 
    get_student, 
    get_student_by_email, 
    get_students,
    update_student, 
    delete_student
)

@pytest.fixture
def mock_student_data():
    """Fixture providing standard student data matching exact SQLAlchemy ORM model constraints."""
    return {
        "student_id": "12345678",
        "first_name": "Test",
        "last_name": "Student",
        "preferred_name": "Tester",
        "email": "test.student@example.com",
        "status": "enrolled",
        "image_url": "http://example.com/image.jpg"
    }

def test_create_student(db_session: Session, mock_student_data):
    """Test successful student creation."""
    student = create_student(db_session, student_data=mock_student_data)
    
    assert student.student_id == mock_student_data["student_id"]
    assert student.first_name == mock_student_data["first_name"]
    assert student.email == mock_student_data["email"]
    assert student.status == "enrolled"

def test_create_student_default_status(db_session: Session, mock_student_data):
    """Test creating a student without explicitly providing a status relies on model defaults."""
    test_data = mock_student_data.copy()
    test_data["student_id"] = "99887766"
    test_data["email"] = "default.status@example.com"
    del test_data["status"]
    
    student = create_student(db_session, student_data=test_data)
    
    assert student.student_id == "99887766"
    # SQLAlchemy's Python-level default logic naturally locks it into ENROLLED!
    assert student.status == "enrolled"

def test_get_student(db_session: Session, mock_student_data):
    """Test fetching a student by ID."""
    created_student = create_student(db_session, student_data=mock_student_data)
    
    found_student = get_student(db_session, student_id=created_student.student_id)
    assert found_student is not None
    assert found_student.first_name == mock_student_data["first_name"]
    
    not_found = get_student(db_session, student_id="99999999")
    assert not_found is None

def test_get_student_by_email(db_session: Session, mock_student_data):
    """Test fetching a student by Email."""
    created_student = create_student(db_session, student_data=mock_student_data)
    
    found_student = get_student_by_email(db_session, email=mock_student_data["email"])
    assert found_student is not None
    assert found_student.student_id == created_student.student_id
    
    not_found = get_student_by_email(db_session, email="unknown@example.com")
    assert not_found is None

def test_get_students(db_session: Session, mock_student_data):
    """Test fetching a paginated list of students."""
    create_student(db_session, student_data=mock_student_data)
    
    second_student_data = mock_student_data.copy()
    second_student_data["student_id"] = "87654321"
    second_student_data["email"] = "second@example.com"
    create_student(db_session, student_data=second_student_data)
    
    students = get_students(db_session, skip=0, limit=10)
    assert len(students) >= 2

def test_update_student(db_session: Session, mock_student_data):
    """Test updating existing student records."""
    student = create_student(db_session, student_data=mock_student_data)
    
    update_data = {"first_name": "New", "status": "dropped"}
    updated_student = update_student(db_session, db_student=student, update_data=update_data)
    
    assert updated_student.first_name == "New"
    assert updated_student.last_name == mock_student_data["last_name"]
    assert updated_student.status == "dropped"

def test_delete_student(db_session: Session, mock_student_data):
    """Test purging a student from the database."""
    student = create_student(db_session, student_data=mock_student_data)
    
    # Verify they exist
    assert get_student(db_session, student_id=student.student_id) is not None
    
    # Delete them
    delete_student(db_session, db_student=student)
    
    # Verify thoroughly obliterated
    assert get_student(db_session, student_id=student.student_id) is None
