from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Backend Partimark đã sẵn sàng phục vụ UWA!"}

@app.get("/test")
def test():
    return {"status": "Online", "version": "1.0.0"}