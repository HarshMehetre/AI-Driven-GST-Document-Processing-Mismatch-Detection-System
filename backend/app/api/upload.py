import os
from fastapi import APIRouter, UploadFile, File, Form
from typing import List
from app.config import UPLOAD_DIR

router = APIRouter()

@router.post("/")
async def upload_invoices(
    client_name: str = Form(...),
    month: str = Form(...),   # format: YYYY_MM
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple invoice files for a client and month
    """

    # Create directory: uploads/client_name/month
    client_path = os.path.join(UPLOAD_DIR, client_name, month)
    os.makedirs(client_path, exist_ok=True)

    saved_files = []

    for file in files:
        file_path = os.path.join(client_path, file.filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        saved_files.append(file.filename)

    return {
        "message": "Files uploaded successfully",
        "client": client_name,
        "month": month,
        "file_count": len(saved_files),
        "files": saved_files
    }
