from fastapi import FastAPI
from app.api.upload import router as upload_router

app = FastAPI(
    title="AI GST Document Processing API",
    version="1.0.0"
)

app.include_router(upload_router, prefix="/upload")

@app.get("/")
def health_check():
    return {"status": "Backend running"}
