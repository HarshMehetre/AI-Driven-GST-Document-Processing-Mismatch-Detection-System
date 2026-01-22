import pytesseract
from PIL import Image
import os

# EXPLICIT path to Tesseract (this fixes everything)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_text_from_image(image_path: str) -> str:
    if not os.path.exists(image_path):
        return "File not found"

    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        return str(e)
