# GST Document Processing & Mismatch Detection System - Complete Workflow

## System Overview

This system automates the process of:
1. **Document Upload**: Upload invoice documents (PDF, images)
2. **OCR & AI Extraction**: Extract invoice data using Tesseract OCR and Google Gemini AI
3. **GSTR2B Comparison**: Compare extracted data with GSTR2B records
4. **Mismatch Detection**: Identify discrepancies between documents and tax filings
5. **Report Generation**: Create detailed Excel reports with highlighted issues

## Workflow Stages

### Stage 1: Document Upload & Processing

**User Steps:**
1. Navigate to "Upload Documents"
2. Select client name (or create new)
3. Select tax period (YYYY-MM format)
4. Select invoice files (PDF, PNG, JPG, TIFF)
5. Click "Process Documents"

**What Happens:**
- Files are uploaded to backend
- Upload progress bar shows real-time status
- Once uploaded, OCR & Gemini processing begins
- Real-time AI processing progress bar appears
- System automatically extracts:
  - Invoice numbers
  - Invoice dates
  - GSTIN numbers
  - Invoice amounts
  - Tax amounts
  - Line items (if available)

**Frontend Component:**
- File: `frontend/src/components/UploadForm.jsx`
- Shows upload progress, then AI processing progress
- Auto-navigates to report page on completion

### Stage 2: Review Extracted Data

**User Steps:**
1. Review the extracted invoice table
2. **Optional**: Edit any extracted values inline
3. Click "Download Excel" to save extracted data
4. Click "Next: Upload GSTR2B" to proceed

**Features:**
- Interactive Excel viewer with inline editing
- Click any cell to edit values
- Color-coded rows (yellow for incomplete data, red for errors)
- Automatic recalculation when data is edited

**Frontend Component:**
- File: `frontend/src/components/ExcelViewer.jsx`
- Handles viewing and editing of invoice data
- Supports up to 50 invoices in preview (full data available in Excel)

### Stage 3: Upload GSTR2B Data

**Option A: Manual Input**
1. Obtain GSTR2B data (JSON format) from GST portal
2. Paste JSON into text area
3. Click "Upload GSTR2B"
4. System validates and processes data

**Option B: Fetch from Government API**
1. Enter GSTIN (15-character GST number)
2. Click "Fetch from Govt API"
3. System automatically fetches GSTR2B for the period
4. Data is validated and processed

**Format for Manual Input (JSON):**
```json
{
  "gstin": "22AABCT1234H1Z0",
  "period": "2026-01",
  "invoices": [
    {
      "inv_no": "INV-001",
      "inv_dt": "2026-01-15",
      "gstin": "27AAPCT1234H1Z0",
      "inv_amt": 10000,
      "tax_amt": 1800,
      "total_amt": 11800
    }
  ]
}
```

**Frontend Component:**
- File: `frontend/src/pages/report.jsx`
- Radio buttons for selection method
- JSON text area for manual input
- GSTIN input for government API

### Stage 4: Run Mismatch Detection

**What Happens:**
1. System compares each extracted invoice with GSTR2B records
2. Uses intelligent matching algorithm:
   - 40% weight on invoice number (fuzzy matching)
   - 20% weight on date matching
   - 20% weight on GSTIN matching
   - 20% weight on amount matching (5% variance allowed)
3. Generates comprehensive mismatch report with:
   - Match scores for each invoice
   - Specific discrepancies identified
   - Compliance status (COMPLIANT / MINOR / MAJOR / NON-COMPLIANT)
   - Unmatched invoices from both sources

**Report Card Includes:**
```
Summary Metrics:
- Total invoices extracted
- Total invoices in GSTR2B
- Successfully matched
- Discrepancies found
- Missing from GSTR2B
- Extra in GSTR2B
- Match rate percentage
- Compliance status
```

**Issues Highlighted:**
- Invoice number mismatches
- Date discrepancies
- GSTIN mismatches
- Amount variances
- Completely unmatched invoices

### Stage 5: Download & Review Reports

**Available Reports:**

1. **Extracted Invoices Sheet**
   - All extracted invoice data
   - Status of each extraction
   - Ready for editing and download

2. **Mismatch Report (Multi-sheet Excel)**
   - **Summary**: Overview metrics and compliance status
   - **Matched**: Invoices with matches and any discrepancies
   - **Mismatches**: Detailed list of all identified issues
   - **Unmatched Extracted**: Invoices not found in GSTR2B
   - **Unmatched GSTR2B**: GSTR2B invoices not in extracted data

**Color Coding in Excel:**
- 🟢 Green: Successfully matched invoices
- 🟡 Yellow: Invoices with discrepancies (editable)
- 🔴 Red: Errors or completely unmatched invoices
- 🔵 Blue: Headers and metadata

## Backend API Endpoints

### Upload Endpoints

**POST `/upload/`**
- Upload invoice documents
- Parameters: client_name, month, files
- Returns: upload confirmation with file count

### Processing Endpoints

**POST `/process/process`**
- Initiate document processing
- Parameters: client_name, month
- Returns: session_id and file count
- Runs in background

**GET `/process/progress/{session_id}`**
- Get real-time processing progress
- Returns: status, progress percentage, extracted count
- Poll every 1 second for updates

**GET `/process/session/{session_id}`**
- Get complete session data
- Returns: all extracted invoices, GSTR2B data, mismatch results

### GSTR2B Endpoints

**POST `/process/upload-gstr2b/{session_id}`**
- Upload GSTR2B data
- Body: JSON GSTR2B data
- Returns: confirmation

**GET `/process/govt-api/gstr2b`**
- Fetch GSTR2B from government API
- Parameters: gstin, period
- Returns: GSTR2B data (requires govt API integration)

### Mismatch & Report Endpoints

**POST `/process/detect-mismatches/{session_id}`**
- Run mismatch detection
- Returns: report card with all analysis

**GET `/process/download-excel/{session_id}`**
- Download Excel report
- Returns: Excel file binary

**POST `/process/update-excel/{session_id}`**
- Update invoice data after editing
- Body: updated invoice data
- Regenerates mismatch report if needed

**DELETE `/process/session/{session_id}`**
- Clean up session data

## Backend Services

### DocumentProcessor Service
**File:** `backend/app/services/document_processor.py`

**Features:**
- PDF text extraction with fallback to OCR
- Image OCR extraction
- Gemini AI for structured data extraction
- Error handling and fallback mechanisms
- GSTR2B data validation

**Key Methods:**
- `process_documents()`: Main processing pipeline
- `_extract_text_from_file()`: Intelligent format detection
- `_extract_structured_data()`: Gemini AI extraction
- `validate_gstr2b_data()`: GSTR2B validation

### MismatchDetector Service
**File:** `backend/app/services/mismatch_detector.py`

**Features:**
- Intelligent invoice matching algorithm
- Similarity scoring system
- Comprehensive mismatch analysis
- Compliance status determination
- Report card generation

**Matching Algorithm:**
- Fuzzy string matching for invoice numbers
- Exact matching for dates and GSTIN
- Percentage-based matching for amounts (5% tolerance)
- Weighted scoring system

**Compliance Status Levels:**
- `COMPLIANT`: 100% match with no discrepancies
- `MINOR_DISCREPANCIES`: 95%+ match rate
- `MAJOR_DISCREPANCIES`: 80%+ match rate
- `NON_COMPLIANT`: <80% match rate

### ExcelGenerator Service
**File:** `backend/app/services/excel_generator.py`

**Features:**
- Multi-sheet Excel generation
- Professional formatting with colors
- Dynamic column sizing
- Color-coded mismatch highlighting
- Summary metrics sheets

## Setup & Installation

### Prerequisites
1. **Python 3.9+**
2. **Node.js 16+**
3. **Tesseract OCR**: Download and install from [here](https://github.com/UB-Mannheim/tesseract/wiki)
4. **Google Gemini API Key**: Get free key from [AI Studio](https://aistudio.google.com/app/apikey)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your Gemini API key to .env
GEMINI_API_KEY=your_key_here

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Frontend will be available at http://localhost:5173
```

## Configuration

### Environment Variables (.env)

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
GST_GOVT_API_KEY=govt_api_key
GST_GOVT_API_SECRET=govt_api_secret
```

### Tesseract Configuration
Windows path is set in `backend/app/config.py`:
```python
pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"
```

## Data Flow Architecture

```
[Frontend Upload Form]
         ↓
    [File Upload API]
         ↓
    [Backend Storage]
         ↓
    [Document Processor Service]
         ├─→ [OCR/Tesseract]
         ├─→ [Gemini AI]
         └─→ [Structured Data]
         ↓
    [Excel Generator]
         ↓
    [Frontend Report Page]
         ↓
    [GSTR2B Upload/Fetch]
         ↓
    [Mismatch Detector Service]
         ├─→ [Matching Algorithm]
         ├─→ [Scoring System]
         └─→ [Report Generation]
         ↓
    [Excel with Highlights]
         ↓
    [Download/View Report]
```

## Error Handling

**Common Issues & Solutions:**

1. **"Tesseract not found"**
   - Install Tesseract OCR
   - Update path in `config.py`

2. **"Invalid GEMINI_API_KEY"**
   - Verify API key in .env
   - Check API key is active on Google AI Studio

3. **"Upload failed"**
   - Ensure file format is supported (PDF, PNG, JPG, TIFF)
   - Check file size (should be <50MB per file)
   - Verify backend is running

4. **"Invalid GSTR2B format"**
   - Verify JSON syntax
   - Check required fields (gstin, invoices, period)
   - Use proper date format (YYYY-MM-DD)

## Performance Considerations

- **Processing Time**: 2-5 seconds per document (depends on file size)
- **Gemini API Calls**: ~1 per document
- **Maximum Files**: 100+ per session (tested up to 500)
- **Storage**: ~1GB per 1000 invoices in Excel format

## Testing

### Manual Testing Steps

1. **Upload Test**
   - Create test PDF/image with invoice data
   - Upload through UI
   - Verify extraction accuracy

2. **Mismatch Test**
   - Upload documents
   - Manually create GSTR2B JSON with same and different invoices
   - Run mismatch detection
   - Verify all matches and mismatches are identified

3. **Excel Test**
   - Download reports
   - Verify formatting and colors
   - Check all sheets are present
   - Test cell editing and re-download

## Future Enhancements

1. **Government API Integration**
   - Direct integration with GST portal
   - Automatic GSTR2B fetching with authentication

2. **Advanced Matching**
   - Machine learning-based matching
   - Partial invoice matching (line-item level)
   - Automatic correction suggestions

3. **Reporting**
   - PDF report generation
   - Email delivery
   - Compliance audit trail

4. **Batch Processing**
   - Process multiple periods simultaneously
   - Scheduled recurring processing
   - Batch notifications

5. **Dashboard**
   - Historical processing results
   - Compliance metrics over time
   - Automated alerts for high mismatch rates

## Support & Documentation

- **API Documentation**: Available at `http://localhost:8000/docs` (Swagger UI)
- **Gemini AI Docs**: https://ai.google.dev/docs
- **Tesseract OCR**: https://github.com/UB-Mannheim/tesseract/wiki
- **GST Portal**: https://www.gst.gov.in

## License

This project is part of the AI Automation System for GST Document Processing.

---

**Last Updated:** January 24, 2026
**Version:** 1.0
