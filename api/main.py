from fastapi import FastAPI APIRouter

app = FastAPI()
router = APIRouter(prefix="/api")

@router.get("/")
def home():
    return {"message": "Backend Partimark is ready!"}

@router.get("/test")
def test():
    return {"status": "Online", "version": "1.0.0"}

app.include_router(router)