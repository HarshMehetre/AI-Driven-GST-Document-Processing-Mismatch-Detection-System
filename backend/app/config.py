import os
from dotenv import load_dotenv
import pytesseract

load_dotenv()

# 🔹 Tesseract path (WINDOWS)
pytesseract.pytesseract.tesseract_cmd = (
    r"C:/Program Files/Tesseract-OCR/tesseract.exe"
)

# 🔹 Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 🔹 Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")
EXCEL_DIR = os.path.join(BASE_DIR, "data", "excel")
