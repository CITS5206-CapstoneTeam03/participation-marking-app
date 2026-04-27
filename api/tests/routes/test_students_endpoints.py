import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from partimark_app.crud import crud_student_workshop_memberships as crud_memberships
from partimark_app.models.enabled_weeks import EnabledWeek
from partimark_app.models.marks import ParticipationMark
from partimark_app.models.student_workshop_memberships import StudentWorkshopMembership
from partimark_app.models.users import User, UserRole

def test_create_student_route(client: TestClient):
    """Test the POST /api/students/ route creates a student successfully."""
    response = client.post(
        "/api/students/",
        json={
            "student_id": "87654321",
            "first_name": "API",
            "last_name": "Student",
            "preferred_name": "API Student",
            "email": "route.student@example.com",
            "status": "active",
            "image_url": "http://example.com/image.jpg"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == "87654321"
    assert data["status"] == "active"

def test_create_student_route_default_status(client: TestClient):
    """Test creating a student without providing status, expecting PyDantic to apply the default 'enrolled'."""
    response = client.post(
        "/api/students/",
        json={
            "student_id": "99988877",
            "first_name": "Default",
            "last_name": "Status",
            "preferred_name": "Def",
            "email": "default.route@example.com",
            "image_url": "http://example.com/image.jpg"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == "99988877"
    assert data["status"] == "active"

def test_create_student_duplicate_email(client: TestClient):
    """Test the POST /api/students/ route handles conflicts properly."""
    payload = {
        "student_id": "11111111",
        "first_name": "Conflict",
        "last_name": "Student",
        "preferred_name": "Con",
        "email": "conflict@example.com",
        "status": "active",
        "image_url": "http://example.com/image.jpg"
    }
    client.post("/api/students/", json=payload)
    
    # Duplicate attempt
    response = client.post("/api/students/", json=payload)
    assert response.status_code in [400, 409]

def test_get_students_route(client: TestClient):
    """Test the GET /api/students/ route to retrieve a list of students."""
    client.post("/api/students/", json={
        "student_id": "22222222", "first_name": "Get", "last_name": "User",
        "preferred_name": "Get", "email": "get_test@example.com", "status": "active", "image_url": "http://example.com/image.jpg"
    })
    
    response = client.get("/api/students/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_student_route(client: TestClient):
    """Test the GET /api/students/{id} route retrieves the specific student."""
    client.post("/api/students/", json={
        "student_id": "33333333", "first_name": "Single", "last_name": "User",
        "preferred_name": "Single", "email": "single@example.com", "status": "active", "image_url": "http://example.com/image.jpg"
    })
    
    response = client.get("/api/students/33333333")
    assert response.status_code == 200
    assert response.json()["student_id"] == "33333333"

def test_update_student_route(client: TestClient):
    """Test the PATCH /api/students/{id} effectively updates fields."""
    client.post("/api/students/", json={
        "student_id": "44444444", "first_name": "Update", "last_name": "Me",
        "preferred_name": "UpMe", "email": "update@example.com", "status": "active", "image_url": "http://example.com/image.jpg"
    })
    
    response = client.patch("/api/students/44444444", json={
        "first_name": "UpdatedName"
    })
    assert response.status_code == 200
    assert response.json()["first_name"] == "UpdatedName"
    assert response.json()["last_name"] == "Me"

def test_delete_student_route(client: TestClient):
    """Test the DELETE /api/students/{id} properly removes the student."""
    client.post("/api/students/", json={
        "student_id": "55555555", "first_name": "Delete", "last_name": "Me",
        "preferred_name": "Del", "email": "delete@example.com", "status": "active", "image_url": "http://example.com/image.jpg"
    })
    
    del_res = client.delete("/api/students/55555555")
    assert del_res.status_code == 204
    
    get_res = client.get("/api/students/55555555")
    assert get_res.status_code == 404


def _create_student_for_move(client: TestClient, student_id: str = "77777777") -> None:
    response = client.post("/api/students/", json={
        "student_id": student_id,
        "first_name": "Move",
        "last_name": "Student",
        "preferred_name": "Mover",
        "email": f"{student_id}@example.com",
        "status": "active",
        "image_url": "http://example.com/image.jpg",
    })
    assert response.status_code == 201


def _create_workshop(client: TestClient, workshop_name: str) -> int:
    response = client.post("/api/workshops/", json={
        "workshop_name": workshop_name,
        "tutor_user_id": None,
        "is_active": True,
    })
    assert response.status_code == 201
    return response.json()["workshop_id"]


def test_move_student_reassigns_current_membership_and_preserves_marks(
    client: TestClient,
    db_session: Session,
):
    _create_student_for_move(client)
    old_workshop_id = _create_workshop(client, "Move Source Workshop")
    new_workshop_id = _create_workshop(client, "Move Target Workshop")

    original_membership = crud_memberships.move_student_to_workshop(
        db_session,
        student_id="77777777",
        target_workshop_id=old_workshop_id,
    )

    marker = User(
        user_id="marker-user",
        email="marker@example.com",
        hashed_password="not-used-in-test",
        first_name="Marker",
        last_name="User",
        display_name="Marker User",
        role=UserRole.TUTOR,
        is_active=True,
    )
    db_session.add(marker)
    db_session.add(EnabledWeek(week_number=1))
    historical_mark = ParticipationMark(
        student_id="77777777",
        workshop_id=old_workshop_id,
        week_number=1,
        score=3,
        marked_by_user_id=marker.user_id,
    )
    db_session.add(historical_mark)
    db_session.commit()

    response = client.post(
        "/api/students/77777777/move",
        json={"target_workshop_id": new_workshop_id},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "77777777"
    assert data["workshop_id"] == new_workshop_id
    assert data["is_current"] is True
    assert data["previous_workshop_ids"] == [old_workshop_id]

    db_session.refresh(original_membership)
    db_session.refresh(historical_mark)

    assert original_membership.is_current is False
    assert original_membership.end_date is not None
    assert historical_mark.workshop_id == old_workshop_id
    assert historical_mark.score == 3

    current_memberships = crud_memberships.get_current_memberships_by_student(
        db_session,
        student_id="77777777",
    )
    assert len(current_memberships) == 1
    assert current_memberships[0].workshop_id == new_workshop_id


def test_move_student_rejects_nonexistent_target_workshop(client: TestClient):
    _create_student_for_move(client, student_id="77777778")

    response = client.post(
        "/api/students/77777778/move",
        json={"target_workshop_id": 999999},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Target workshop not found."


def test_move_student_rejects_same_current_workshop(
    client: TestClient,
    db_session: Session,
):
    _create_student_for_move(client, student_id="77777779")
    workshop_id = _create_workshop(client, "Move Same Workshop")
    crud_memberships.move_student_to_workshop(
        db_session,
        student_id="77777779",
        target_workshop_id=workshop_id,
    )

    response = client.post(
        "/api/students/77777779/move",
        json={"target_workshop_id": workshop_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already assigned to the target workshop."

    current_memberships = crud_memberships.get_current_memberships_by_student(
        db_session,
        student_id="77777779",
    )
    assert len(current_memberships) == 1
    assert current_memberships[0].workshop_id == workshop_id


def test_crud_move_student_rejects_same_current_workshop(
    client: TestClient,
    db_session: Session,
):
    _create_student_for_move(client, student_id="77777780")
    workshop_id = _create_workshop(client, "Move Same Workshop Crud")
    crud_memberships.move_student_to_workshop(
        db_session,
        student_id="77777780",
        target_workshop_id=workshop_id,
    )

    with pytest.raises(ValueError, match="already assigned"):
        crud_memberships.move_student_to_workshop(
            db_session,
            student_id="77777780",
            target_workshop_id=workshop_id,
        )

    current_memberships = crud_memberships.get_current_memberships_by_student(
        db_session,
        student_id="77777780",
    )
    assert len(current_memberships) == 1
    assert current_memberships[0].workshop_id == workshop_id
