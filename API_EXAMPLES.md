# API Usage Examples

## Backend API Reference with cURL Examples

### Base URL
```
http://localhost:8000
```

### 1. Upload Documents

**Endpoint:** `POST /upload/`

**Description:** Upload invoice files for processing

**Request:**
```bash
curl -X POST http://localhost:8000/upload/ \
  -F "client_name=ABC_Company" \
  -F "month=2026_01" \
  -F "files=@invoice1.pdf" \
  -F "files=@invoice2.pdf"
```

**Response:**
```json
{
  "status": "success",
  "message": "Files uploaded successfully",
  "client": "ABC_Company",
  "month": "2026_01",
  "file_count": 2,
  "files": [
    {
      "filename": "invoice1.pdf",
      "size": 50000,
      "path": "/path/to/uploads/ABC_Company/2026_01/invoice1.pdf"
    }
  ],
  "upload_dir": "/path/to/uploads/ABC_Company/2026_01"
}
```

---

### 2. Start Document Processing

**Endpoint:** `POST /process/process`

**Description:** Initiate OCR and Gemini AI processing

**Request:**
```bash
curl -X POST "http://localhost:8000/process/process?client_name=ABC_Company&month=2026_01"
```

**Response:**
```json
{
  "status": "processing_started",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_name": "ABC_Company",
  "month": "2026_01",
  "file_count": 2
}
```

---

### 3. Get Processing Progress

**Endpoint:** `GET /process/progress/{session_id}`

**Description:** Poll for real-time processing status

**Request:**
```bash
curl http://localhost:8000/process/progress/550e8400-e29b-41d4-a716-446655440000
```

**Response - In Progress:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "extracting",
  "progress": 45,
  "extracted_count": 1,
  "error": null
}
```

**Response - Completed:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "extracted_count": 2,
  "error": null
}
```

---

### 4. Get Full Session Data

**Endpoint:** `GET /process/session/{session_id}`

**Description:** Retrieve all data for a processing session

**Request:**
```bash
curl http://localhost:8000/process/session/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_name": "ABC_Company",
  "month": "2026_01",
  "status": "completed",
  "progress": 100,
  "extracted_invoices": [
    {
      "file": "invoice1.pdf",
      "invoice_number": "INV-001",
      "invoice_date": "2026-01-15",
      "gstin": "27AAPCT1234H1Z0",
      "invoice_amount": 10000,
      "tax_amount": 1800,
      "total_amount": 11800,
      "items": [...],
      "status": "valid"
    }
  ],
  "gstr2b_data": null,
  "mismatch_results": null,
  "excel_data": {
    "filename": "invoices.xlsx",
    "size": 25000,
    "data_preview": [...]
  },
  "error": null
}
```

---

### 5. Upload GSTR2B Data (Manual)

**Endpoint:** `POST /process/upload-gstr2b/{session_id}`

**Description:** Upload GSTR2B data for mismatch detection

**Request:**
```bash
curl -X POST http://localhost:8000/process/upload-gstr2b/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "GSTR2B data uploaded successfully",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 6. Fetch GSTR2B from Government API

**Endpoint:** `GET /process/govt-api/gstr2b`

**Description:** Fetch GSTR2B from government portal

**Request:**
```bash
curl "http://localhost:8000/process/govt-api/gstr2b?gstin=22AABCT1234H1Z0&period=2026-01"
```

**Response:**
```json
{
  "status": "success",
  "data": {
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
    ],
    "status": "fetched_from_govt"
  },
  "message": "GSTR2B data fetched from government portal"
}
```

---

### 7. Detect Mismatches

**Endpoint:** `POST /process/detect-mismatches/{session_id}`

**Description:** Run mismatch detection algorithm

**Request:**
```bash
curl -X POST http://localhost:8000/process/detect-mismatches/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "status": "success",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "report_card": {
    "title": "GST Document Mismatch Report",
    "generated_at": "2026-01-24T10:30:00.123456",
    "summary": {
      "total_invoices_extracted": 2,
      "total_invoices_gstr2b": 2,
      "successfully_matched": 1,
      "discrepancies_found": 1,
      "missing_from_gstr2b": 1,
      "extra_in_gstr2b": 0,
      "compliance_status": "MAJOR_DISCREPANCIES"
    },
    "detail": {
      "mismatches": [
        {
          "invoice_number": "INV-002",
          "match_score": 0.75,
          "issues": [
            "Amount mismatch: 5000 vs 5500",
            "Date mismatch: 2026-01-20 vs 2026-01-21"
          ]
        }
      ],
      "unmatched_extracted": [
        {
          "invoice": {
            "file": "invoice2.pdf",
            "invoice_number": "INV-003",
            "total_amount": 3000
          },
          "reason": "No matching invoice in GSTR2B"
        }
      ],
      "unmatched_gstr2b": []
    }
  }
}
```

---

### 8. Download Excel Report

**Endpoint:** `GET /process/download-excel/{session_id}`

**Description:** Download the generated Excel report

**Request:**
```bash
curl -O http://localhost:8000/process/download-excel/550e8400-e29b-41d4-a716-446655440000
```

**Response:** Binary Excel file (.xlsx)

```bash
# Save to file
curl -o report.xlsx http://localhost:8000/process/download-excel/550e8400-e29b-41d4-a716-446655440000
```

---

### 9. Update Excel Data (Edit)

**Endpoint:** `POST /process/update-excel/{session_id}`

**Description:** Update invoice data after manual editing

**Request:**
```bash
curl -X POST http://localhost:8000/process/update-excel/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "invoices": [
      {
        "file": "invoice1.pdf",
        "invoice_number": "INV-001",
        "invoice_date": "2026-01-15",
        "gstin": "27AAPCT1234H1Z0",
        "invoice_amount": 10000,
        "tax_amount": 1800,
        "total_amount": 11800
      }
    ]
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Excel data updated",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 10. Delete Session

**Endpoint:** `DELETE /process/session/{session_id}`

**Description:** Clean up session data

**Request:**
```bash
curl -X DELETE http://localhost:8000/process/session/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "status": "success",
  "message": "Session deleted"
}
```

---

## Frontend Integration Examples

### React Hook for Processing

```javascript
// useGstProcessing.js
import { useState, useCallback } from 'react';

export const useGstProcessing = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const pollProgress = useCallback(async (sessionId) => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `http://localhost:8000/process/progress/${sessionId}`
      );
      const data = await response.json();
      
      setProgress(data.progress);
      setStatus(data.status);
      
      if (data.status === 'completed' || data.status === 'error') {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { progress, status, sessionId, setSessionId, pollProgress };
};

// Usage in component
const { progress, status, sessionId, pollProgress } = useGstProcessing();
```

---

## Error Handling Examples

### Common Error Responses

**Invalid Client Name:**
```json
{
  "detail": "Invalid client name format"
}
```

**Invalid GSTR2B Format:**
```json
{
  "detail": "Invalid JSON format. Please check your GSTR2B data."
}
```

**Session Not Found:**
```json
{
  "detail": "Session not found"
}
```

**No Files Uploaded:**
```json
{
  "detail": "Upload directory not found"
}
```

---

## Complete Workflow Example (Shell Script)

```bash
#!/bin/bash

# 1. Upload files
UPLOAD_RESPONSE=$(curl -X POST http://localhost:8000/upload/ \
  -F "client_name=ABC_Company" \
  -F "month=2026_01" \
  -F "files=@invoice1.pdf" \
  -F "files=@invoice2.pdf")

echo "Upload: $UPLOAD_RESPONSE"

# 2. Start processing
PROCESS_RESPONSE=$(curl -X POST "http://localhost:8000/process/process?client_name=ABC_Company&month=2026_01")
SESSION_ID=$(echo $PROCESS_RESPONSE | jq -r '.session_id')

echo "Session ID: $SESSION_ID"

# 3. Wait for processing
while true; do
  PROGRESS=$(curl http://localhost:8000/process/progress/$SESSION_ID)
  PERCENT=$(echo $PROGRESS | jq '.progress')
  STATUS=$(echo $PROGRESS | jq -r '.status')
  
  echo "Progress: $PERCENT% - Status: $STATUS"
  
  if [ "$STATUS" == "completed" ]; then
    break
  fi
  
  sleep 1
done

# 4. Upload GSTR2B
GSTR2B_RESPONSE=$(curl -X POST http://localhost:8000/process/upload-gstr2b/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d @gstr2b_data.json)

echo "GSTR2B Upload: $GSTR2B_RESPONSE"

# 5. Run mismatch detection
MISMATCH=$(curl -X POST http://localhost:8000/process/detect-mismatches/$SESSION_ID)
REPORT=$(echo $MISMATCH | jq '.report_card.summary')

echo "Mismatch Report: $REPORT"

# 6. Download Excel
curl -o report.xlsx http://localhost:8000/process/download-excel/$SESSION_ID

echo "Report downloaded to report.xlsx"
```

---

## Testing with Postman

### Environment Variables Setup:
```
base_url: http://localhost:8000
session_id: {{SESSION_ID}}
```

### Requests:
1. **Upload** → Save response `session_id` as `{{SESSION_ID}}`
2. **Progress** → Use saved `{{SESSION_ID}}`
3. **Upload GSTR2B** → Use saved `{{SESSION_ID}}`
4. **Detect Mismatches** → Use saved `{{SESSION_ID}}`
5. **Download Excel** → Use saved `{{SESSION_ID}}`

---

## Performance Tips

1. **Polling Interval:** Use 1000ms (1 second) for progress updates
2. **Timeout:** Set API timeout to 30 seconds (Gemini can take 5-10 seconds)
3. **File Size:** Keep individual files under 50MB
4. **Batch Processing:** Upload maximum 100 files per session

---

## Rate Limiting Considerations

- Gemini API: Free tier has rate limits
- Implement queue-based processing for production
- Add exponential backoff for retries

---

Generated: January 24, 2026
