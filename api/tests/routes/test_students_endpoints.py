import pytest
from fastapi.testclient import TestClient

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
            "status": "enrolled",
            "image_url": "http://example.com/image.jpg"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == "87654321"
    assert data["status"] == "enrolled"

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
    assert data["status"] == "enrolled"

def test_create_student_duplicate_email(client: TestClient):
    """Test the POST /api/students/ route handles conflicts properly."""
    payload = {
        "student_id": "11111111",
        "first_name": "Conflict",
        "last_name": "Student",
        "preferred_name": "Con",
        "email": "conflict@example.com",
        "status": "enrolled",
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
        "preferred_name": "Get", "email": "get_test@example.com", "status": "enrolled", "image_url": "http://example.com/image.jpg"
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
        "preferred_name": "Single", "email": "single@example.com", "status": "enrolled", "image_url": "http://example.com/image.jpg"
    })
    
    response = client.get("/api/students/33333333")
    assert response.status_code == 200
    assert response.json()["student_id"] == "33333333"

def test_update_student_route(client: TestClient):
    """Test the PATCH /api/students/{id} effectively updates fields."""
    client.post("/api/students/", json={
        "student_id": "44444444", "first_name": "Update", "last_name": "Me",
        "preferred_name": "UpMe", "email": "update@example.com", "status": "enrolled", "image_url": "http://example.com/image.jpg"
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
        "preferred_name": "Del", "email": "delete@example.com", "status": "enrolled", "image_url": "http://example.com/image.jpg"
    })
    
    del_res = client.delete("/api/students/55555555")
    assert del_res.status_code == 204
    
    get_res = client.get("/api/students/55555555")
    assert get_res.status_code == 404
