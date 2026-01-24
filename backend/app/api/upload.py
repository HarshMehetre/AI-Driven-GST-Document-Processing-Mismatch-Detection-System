import os
import sys
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from app.config import UPLOAD_DIR

router = APIRouter()

print(f"[UPLOAD] UPLOAD_DIR configured to: {UPLOAD_DIR}", file=sys.stderr)

@router.post("/")
async def upload_invoices(
    client_name: str = Form(...),
    month: str = Form(...),   # format: YYYY_MM
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple invoice files for a client and month
    
    - **client_name**: Client identifier (e.g., ABC_Enterprises)
    - **month**: Month in format YYYY_MM (e.g., 2026_01)
    - **files**: Multiple PDF/image files
    """
    print(f"\n[UPLOAD] Starting upload for client={client_name}, month={month}, files={len(files)}", file=sys.stderr)
    
    try:
        # Create directory: uploads/client_name/month
        client_path = os.path.join(UPLOAD_DIR, client_name, month)
        print(f"[UPLOAD] Creating directory: {client_path}", file=sys.stderr)
        os.makedirs(client_path, exist_ok=True)
        
        # Verify directory was created
        if not os.path.exists(client_path):
            print(f"[UPLOAD] ERROR: Directory creation failed! Path: {client_path}", file=sys.stderr)
            raise Exception(f"Failed to create directory: {client_path}")
        
        print(f"[UPLOAD] Directory created successfully", file=sys.stderr)

        saved_files = []

        for file in files:
            # Normalize path (Windows safety)
            relative_path = file.filename.replace("\\", "/")

            file_path = os.path.join(client_path, relative_path)

            # 🔑 CREATE missing subfolders
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            print(f"[UPLOAD] Saving file: {file.filename} to {file_path}", file=sys.stderr)

            content = await file.read()
            print(f"[UPLOAD] Read {len(content)} bytes from {file.filename}", file=sys.stderr)

            with open(file_path, "wb") as f:
                bytes_written = f.write(content)
                print(f"[UPLOAD] Wrote {bytes_written} bytes to {file_path}", file=sys.stderr)

            # Verify file was written
            if not os.path.exists(file_path):
                print(f"[UPLOAD] ERROR: File not found after writing: {file_path}", file=sys.stderr)
                raise Exception(f"File write verification failed: {file_path}")
            
            file_size = os.path.getsize(file_path)
            print(f"[UPLOAD] File verified on disk: {file_path} ({file_size} bytes)", file=sys.stderr)

            saved_files.append({
                "filename": file.filename,
                "size": len(content),
                "path": file_path
            })

        print(f"[UPLOAD] ✓ Upload complete! {len(saved_files)} file(s) saved", file=sys.stderr)
        
        return {
            "status": "success",
            "message": "Files uploaded successfully",
            "client": client_name,
            "month": month,
            "file_count": len(saved_files),
            "files": saved_files,
            "upload_dir": client_path
        }
    except Exception as e:
        print(f"[UPLOAD] ✗ ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }
