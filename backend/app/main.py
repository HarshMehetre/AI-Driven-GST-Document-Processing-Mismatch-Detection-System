from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.upload import router as upload_router
from app.api.processing import router as processing_router

app = FastAPI(title="AI GST Document Processing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/upload")
app.include_router(processing_router, prefix="/process")

@app.get("/")
def health_check():
    return {"status": "Backend running"}
