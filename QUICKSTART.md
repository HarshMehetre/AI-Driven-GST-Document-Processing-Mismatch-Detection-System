# Quick Start Guide

## 5-Minute Setup

### 1. Get Your Google Gemini API Key (2 minutes)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 2. Install Dependencies

**Windows Command Prompt:**

```bash
# Install Tesseract OCR
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Run the installer and choose default path

# Backend Setup
cd backend
pip install -r requirements.txt

# Create .env file and add your Gemini key
# GEMINI_API_KEY=your_key_here
```

### 3. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### 4. Start the Frontend (in new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Using the System

### Workflow Example

1. **Upload Documents**
   - Go to http://localhost:5173
   - Click "Upload Documents"
   - Enter: Client Name (e.g., "ABC_Company")
   - Enter: Month (e.g., "2026-01")
   - Select PDF/image files
   - Click "Process Documents"
   - Watch the progress bars

2. **Review Extracted Data**
   - Wait for extraction to complete
   - Review extracted invoices in table
   - Click cells to edit if needed
   - Click "Next: Upload GSTR2B"

3. **Upload GSTR2B**
   - Choose: Manual Input or Govt API
   - For manual: Paste JSON with your GSTR2B data
   - For govt API: Enter GSTIN
   - Click "Upload GSTR2B"

4. **Run Mismatch Detection**
   - Click "Analyze for Mismatches"
   - Wait for analysis to complete

5. **View Report**
   - See compliance status and metrics
   - Review identified mismatches
   - Download Excel report

## Sample GSTR2B JSON Format

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
    },
    {
      "inv_no": "INV-002",
      "inv_dt": "2026-01-20",
      "gstin": "27AAPCT1234H1Z0",
      "inv_amt": 5000,
      "tax_amt": 900,
      "total_amt": 5900
    }
  ]
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `pip install -r requirements.txt` in backend |
| "Tesseract not found" | Install from https://github.com/UB-Mannheim/tesseract/wiki |
| "Invalid API Key" | Check GEMINI_API_KEY in .env file |
| "Port 8000 already in use" | Change port: `uvicorn app.main:app --port 8001` |
| "Port 5173 already in use" | Change port: `npm run dev -- --port 5174` |

## Testing Without Real Documents

1. Create a test.txt file with fake invoice data:
```
Invoice Number: INV-001
Invoice Date: 2026-01-15
GSTIN: 27AAPCT1234H1Z0
Amount: 10000
Tax: 1800
```

2. Upload as PDF (use online converter txt→pdf)
3. System will extract the data

## Next Steps

- Read `WORKFLOW_GUIDE.md` for detailed documentation
- Check API docs at http://localhost:8000/docs
- Integrate with your GST data source
- Set up government API credentials for automatic GSTR2B fetching

---

Need help? Check the troubleshooting section in WORKFLOW_GUIDE.md
