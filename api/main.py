from fastapi import Depends, FastAPI, APIRouter, HTTPException
from sqlalchemy.orm import Session

from db import User, get_db

app = FastAPI()
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
        first_user = db.query(User).order_by(User.id.asc()).first()
        return {
            "ok": True,
            "connected": True,
            "firstRecord": None
            if first_user is None
            else {"id": first_user.id, "name": first_user.name, "email": first_user.email},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB test failed: {e}")

app.include_router(router)