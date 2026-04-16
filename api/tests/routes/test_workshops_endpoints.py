import pytest
from fastapi.testclient import TestClient

def test_create_workshop_route(client: TestClient):
    """Test the POST /api/workshops/ route creates a workshop successfully."""
    response = client.post(
        "/api/workshops/",
        json={
            "workshop_name": "Route Test Workshop",
            "tutor_user_id": "test_tutor",
            "is_active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["workshop_name"] == "Route Test Workshop"
    assert "workshop_id" in data

def test_create_workshop_duplicate(client: TestClient):
    """Test the POST /api/workshops/ route handles name conflicts properly."""
    payload = {
        "workshop_name": "Conflict Workshop",
        "tutor_user_id": "test_tutor"
    }
    client.post("/api/workshops/", json=payload)
    
    # Duplicate attempt
    response = client.post("/api/workshops/", json=payload)
    # The exact string may differ based on implementation, 
    # but standard conventions use 400 or 409
    assert response.status_code in [400, 409]

def test_get_workshops_route(client: TestClient):
    """Test the GET /api/workshops/ route to retrieve a list of workshops."""
    client.post("/api/workshops/", json={
        "workshop_name": "Get Test Workshop",
        "tutor_user_id": "test_tutor"
    })
    
    response = client.get("/api/workshops/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_workshop_route(client: TestClient):
    """Test the GET /api/workshops/{id} route retrieves the specific workshop."""
    setup_res = client.post("/api/workshops/", json={
        "workshop_name": "Single Test Workshop",
        "tutor_user_id": "test_tutor"
    })
    
    workshop_id = setup_res.json()["workshop_id"]
    
    response = client.get(f"/api/workshops/{workshop_id}")
    assert response.status_code == 200
    assert response.json()["workshop_id"] == workshop_id

def test_update_workshop_route(client: TestClient):
    """Test the PATCH /api/workshops/{id} effectively updates fields."""
    setup_res = client.post("/api/workshops/", json={
        "workshop_name": "Update Test Workshop",
        "tutor_user_id": "test_tutor"
    })
    
    workshop_id = setup_res.json()["workshop_id"]
    
    response = client.patch(f"/api/workshops/{workshop_id}", json={
        "is_active": False
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    assert response.json()["workshop_name"] == "Update Test Workshop"

def test_delete_workshop_route(client: TestClient):
    """Test the DELETE /api/workshops/{id} properly removes the workshop."""
    setup_res = client.post("/api/workshops/", json={
        "workshop_name": "Delete Test Workshop",
        "tutor_user_id": "test_tutor"
    })
    
    workshop_id = setup_res.json()["workshop_id"]
    
    del_res = client.delete(f"/api/workshops/{workshop_id}")
    assert del_res.status_code == 204
    
    get_res = client.get(f"/api/workshops/{workshop_id}")
    assert get_res.status_code == 404
