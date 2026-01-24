import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExcelViewer from "../components/ExcelViewer";

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, clientName, month } = location.state || {};

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("extracted"); // extracted, gstr2b, mismatch
  const [gstr2bInput, setGstr2bInput] = useState("manual"); // manual, govt-api
  const [gstr2bData, setGstr2bData] = useState("");
  const [gstr2bLoading, setGstr2bLoading] = useState(false);
  const [gstr2bError, setGstr2bError] = useState(null);
  const [mismatchRunning, setMismatchRunning] = useState(false);
  const [reportCard, setReportCard] = useState(null);
  const [gstin, setGstin] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session found. Please upload documents first.");
      setLoading(false);
      return;
    }

    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/process/session/${sessionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch session data");
      }

      const data = await response.json();
      setSessionData(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load report");
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/process/download-excel/${sessionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to download Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        stage === "extracted"
          ? "invoices.xlsx"
          : "mismatch_report.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Failed to download Excel");
    }
  };

  const handleGstr2bSubmit = async () => {
    if (!gstr2bData.trim()) {
      setGstr2bError("Please enter GSTR2B data");
      return;
    }

    setGstr2bLoading(true);
    setGstr2bError(null);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(gstr2bData);
      } catch {
        throw new Error("Invalid JSON format. Please check your GSTR2B data.");
      }

      const response = await fetch(
        `http://localhost:8000/process/upload-gstr2b/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload GSTR2B");
      }

      setStage("mismatch");
      setGstr2bData("");
      await fetchSessionData();
    } catch (err) {
      setGstr2bError(err.message);
    } finally {
      setGstr2bLoading(false);
    }
  };

  const handleFetchFromGovt = async () => {
    if (!gstin.trim()) {
      setGstr2bError("Please enter GSTIN");
      return;
    }

    setGstr2bLoading(true);
    setGstr2bError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/process/govt-api/gstr2b?gstin=${gstin}&period=${month}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from government API");
      }

      const data = await response.json();

      // Upload the fetched data
      const uploadResponse = await fetch(
        `http://localhost:8000/process/upload-gstr2b/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data.data),
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || "Failed to upload GSTR2B");
      }

      setStage("mismatch");
      setGstin("");
      await fetchSessionData();
    } catch (err) {
      setGstr2bError(err.message);
    } finally {
      setGstr2bLoading(false);
    }
  };

  const handleRunMismatchDetection = async () => {
    setMismatchRunning(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/process/detect-mismatches/${sessionId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run mismatch detection");
      }

      const data = await response.json();
      setReportCard(data.report_card);
      setStage("report");
      await fetchSessionData();
    } catch (err) {
      setError(err.message);
    } finally {
      setMismatchRunning(false);
    }
  };

  const handleEditAndUpdateExcel = async (updatedData) => {
    try {
      const response = await fetch(
        `http://localhost:8000/process/update-excel/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoices: updatedData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update Excel");
      }

      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen max-w-7xl mx-auto px-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="mt-8 bg-white rounded-xl shadow p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleBackToHome}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* Header */}
          <div className="border-b pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📊 GST Document Processing Report
            </h1>
            <p className="text-gray-600">
              Client: <span className="font-medium">{clientName}</span> | Period:{" "}
              <span className="font-medium">{month}</span>
            </p>
          </div>

      {/* Stage 1: Extracted Invoices */}
      {(stage === "extracted" || stage === "gstr2b" || stage === "mismatch" || stage === "report") && (
        <div className="border rounded-lg p-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ✓ Step 1: Extracted Invoices
            </h2>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              📥 Download Excel
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-700">
            <p>
              Total invoices extracted:{" "}
              <span className="font-bold text-blue-600">
                {sessionData?.extracted_invoices?.length || 0}
              </span>
            </p>
          </div>

          <ExcelViewer
            invoices={sessionData?.extracted_invoices || []}
            isEditable={stage === "extracted" || stage === "gstr2b"}
            onUpdate={handleEditAndUpdateExcel}
          />
        </div>
      )}

      {/* Stage 2: GSTR2B Upload */}
      {(stage === "gstr2b" || stage === "mismatch" || stage === "report") && (
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 2: Upload GSTR2B Data
          </h2>

          {gstr2bError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{gstr2bError}</p>
            </div>
          )}

          {stage !== "mismatch" && stage !== "report" ? (
            <>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="manual"
                      checked={gstr2bInput === "manual"}
                      onChange={(e) => setGstr2bInput(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Manual Input (Paste JSON)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="govt-api"
                      checked={gstr2bInput === "govt-api"}
                      onChange={(e) => setGstr2bInput(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Fetch from Govt API</span>
                  </label>
                </div>

                {gstr2bInput === "manual" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Paste GSTR2B JSON Data
                      </label>
                      <textarea
                        value={gstr2bData}
                        onChange={(e) => setGstr2bData(e.target.value)}
                        placeholder='{"gstin": "...", "invoices": [...]}'
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-black outline-none font-mono text-sm"
                      />
                    </div>
                    <button
                      onClick={handleGstr2bSubmit}
                      disabled={gstr2bLoading}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 font-medium"
                    >
                      {gstr2bLoading ? "Uploading..." : "Upload GSTR2B"}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter GSTIN
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="Enter 15-character GSTIN"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleFetchFromGovt}
                      disabled={gstr2bLoading}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 font-medium"
                    >
                      {gstr2bLoading ? "Fetching..." : "Fetch from Govt API"}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">
                ✓ GSTR2B data uploaded successfully
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stage 3: Mismatch Detection */}
      {(stage === "mismatch" || stage === "report") && (
        <div className="border rounded-lg p-6 bg-orange-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 3: Run Mismatch Detection
          </h2>

          {stage === "mismatch" && !mismatchRunning && (
            <button
              onClick={handleRunMismatchDetection}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              🔍 Analyze for Mismatches
            </button>
          )}

          {mismatchRunning && (
            <div className="flex items-center gap-2 text-orange-700">
              <div className="animate-spin">⏳</div>
              <span>Running mismatch detection...</span>
            </div>
          )}
        </div>
      )}

      {/* Stage 4: Report Card */}
      {stage === "report" && reportCard && (
        <div className="border rounded-lg p-6 bg-green-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Mismatch Analysis Report
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Extracted</p>
              <p className="text-2xl font-bold text-green-600">
                {reportCard.summary.total_invoices_extracted}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">GSTR2B Invoices</p>
              <p className="text-2xl font-bold text-green-600">
                {reportCard.summary.total_invoices_gstr2b}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Matched</p>
              <p className="text-2xl font-bold text-blue-600">
                {reportCard.summary.successfully_matched}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600">Discrepancies</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reportCard.summary.discrepancies_found}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">Missing</p>
              <p className="text-2xl font-bold text-red-600">
                {reportCard.summary.missing_from_gstr2b}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">Extra</p>
              <p className="text-2xl font-bold text-red-600">
                {reportCard.summary.extra_in_gstr2b}
              </p>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="mb-6 p-4 rounded-lg border-2" 
            style={{
              borderColor: reportCard.summary.compliance_status === "COMPLIANT" ? "#10b981" : 
                          reportCard.summary.compliance_status === "MINOR_DISCREPANCIES" ? "#f59e0b" :
                          reportCard.summary.compliance_status === "MAJOR_DISCREPANCIES" ? "#f97316" : "#ef4444",
              backgroundColor: reportCard.summary.compliance_status === "COMPLIANT" ? "#d1fae5" :
                               reportCard.summary.compliance_status === "MINOR_DISCREPANCIES" ? "#fef3c7" :
                               reportCard.summary.compliance_status === "MAJOR_DISCREPANCIES" ? "#fed7aa" : "#fee2e2"
            }}>
            <p className="font-semibold" style={{
              color: reportCard.summary.compliance_status === "COMPLIANT" ? "#065f46" :
                     reportCard.summary.compliance_status === "MINOR_DISCREPANCIES" ? "#92400e" :
                     reportCard.summary.compliance_status === "MAJOR_DISCREPANCIES" ? "#9a3412" : "#7f1d1d"
            }}>
              Compliance Status: {reportCard.summary.compliance_status}
            </p>
          </div>

          {/* Detailed Mismatches */}
          {reportCard.detail.mismatches.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Issues Found ({reportCard.detail.mismatches.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reportCard.detail.mismatches.map((mismatch, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-yellow-300">
                    <p className="font-medium text-gray-900">
                      Invoice: {mismatch.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Match Score: {(mismatch.match_score * 100).toFixed(1)}%
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {mismatch.issues.map((issue, i) => (
                        <li key={i}>⚠️ {issue}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Final Report */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleDownloadExcel}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              📥 Download Report Excel
            </button>
            <button
              onClick={handleBackToHome}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Home
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && stage !== "extracted" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Prevent moving to next stage prematurely */}
      {stage === "extracted" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            👆 Click "Next" below to proceed to GSTR2B upload
          </p>
          <button
            onClick={() => setStage("gstr2b")}
            className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Next: Upload GSTR2B →
          </button>
        </div>
      )}
        </div>
      </div>
    </main>
  );
};

export default Report;
