import pytest
from fastapi.testclient import TestClient

def test_create_user_route(client: TestClient):
    """Test the POST /api/users/ route creates a user successfully."""
    response = client.post(
        "/api/users/",
        json={
            "email": "route@example.com",
            "first_name": "Route",
            "last_name": "Test",
            "preferred_name": "Router",
            "display_name": "Route Test",
            "role": "admin",
            "is_active": True,
            "password": "strongpassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "route@example.com"
    # Ensure password data is NEVER returned
    assert "password" not in data
    assert "hashed_password" not in data
    assert data["user_id"] is not None

def test_create_user_duplicate_email(client: TestClient):
    """Test the POST /api/users/ route handles conflicts properly."""
    payload = {
        "email": "duplicate@example.com",
        "first_name": "First",
        "last_name": "Last",
        "preferred_name": "Pref",
        "display_name": "Disp",
        "role": "admin",
        "password": "strongpassword123"
    }
    client.post("/api/users/", json=payload)
    
    # Duplicate attempt
    response = client.post("/api/users/", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "User with this email already exists."

def test_get_users_route(client: TestClient):
    """Test the GET /api/users/ route to retrieve a list of users."""
    payload = {
        "email": "get_test@example.com",
        "first_name": "Get", "last_name": "User",
        "preferred_name": "Get", "display_name": "Get User",
        "role": "uc", "password": "strongpassword123"
    }
    client.post("/api/users/", json=payload)
    
    response = client.get("/api/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["email"] == "get_test@example.com"

def test_get_user_route(client: TestClient):
    """Test the GET /api/users/{user_id} route retrieves the specific user."""
    setup_res = client.post("/api/users/", json={
        "email": "single@example.com",
        "first_name": "Single", "last_name": "User",
        "preferred_name": "Single", "display_name": "Single User",
        "role": "facilitator", "password": "strongpassword123"
    })
    user_id = setup_res.json()["user_id"]
    
    response = client.get(f"/api/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["user_id"] == user_id

def test_update_user_route(client: TestClient):
    """Test the PATCH /api/users/{user_id} effectively updates fields."""
    setup_res = client.post("/api/users/", json={
        "email": "update@example.com",
        "first_name": "Update", "last_name": "Me",
        "preferred_name": "UpMe", "display_name": "Update Me",
        "role": "facilitator", "password": "strongpassword123"
    })
    user_id = setup_res.json()["user_id"]
    
    response = client.patch(f"/api/users/{user_id}", json={
        "first_name": "UpdatedName"
    })
    assert response.status_code == 200
    assert response.json()["first_name"] == "UpdatedName"
    assert response.json()["last_name"] == "Me" # Not updated

def test_delete_user_route(client: TestClient):
    """Test the DELETE /api/users/{user_id} properly removes the user."""
    setup_res = client.post("/api/users/", json={
        "email": "delete@example.com",
        "first_name": "Delete", "last_name": "Me",
        "preferred_name": "Del", "display_name": "Delete Me",
        "role": "facilitator", "password": "strongpassword123"
    })
    user_id = setup_res.json()["user_id"]
    
    del_res = client.delete(f"/api/users/{user_id}")
    assert del_res.status_code == 204
    
    get_res = client.get(f"/api/users/{user_id}")
    assert get_res.status_code == 404
