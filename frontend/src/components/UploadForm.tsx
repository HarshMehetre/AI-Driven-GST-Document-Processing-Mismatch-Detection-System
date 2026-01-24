import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const UploadForm = (props: any = {}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize state from location.state if available
  const [clientName, setClientName] = useState(
    location.state?.folderName || "",
  );
  const [month, setMonth] = useState("");
  const [files, setFiles] = useState(location.state?.selectedFiles || []);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);
  
  // Single progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const clientNameInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Focus input when component mounts with folder name
  useEffect(() => {
    if (location.state?.folderName && clientNameInputRef.current) {
      setTimeout(() => {
        clientNameInputRef.current?.focus();
        clientNameInputRef.current?.select();
      }, 100);
    }
  }, [location.state?.folderName]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const pollProcessingProgress = async (sessionId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/process/progress/${sessionId}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to get progress");
      }

      const data = await response.json();

      setProcessingProgress(data.progress);
      setProcessingStatus(data.status);

      console.log("Progress:", data); // Debug log

      if (data.status === "completed") {
        clearInterval(progressIntervalRef.current);
        setIsProcessing(false);
        // Navigate to report page after 2 seconds
        setTimeout(() => {
          navigate("/report", {
            state: {
              sessionId,
              clientName,
              month,
            },
          });
        }, 2000);
      } else if (data.status === "error") {
        clearInterval(progressIntervalRef.current);
        setError(data.error || "Processing failed");
        setIsProcessing(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error polling progress:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientName.trim() || !month || files.length === 0) {
      alert("❌ Please fill all fields and select at least one file!");
      setError("Please fill all fields and select files");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setProcessingProgress(0);
    setIsProcessing(true);

    try {
      // Convert month from YYYY-MM format to YYYY_MM format
      const formattedMonth = month.replace("-", "_");

      const formData = new FormData();
      formData.append("client_name", clientName);
      formData.append("month", formattedMonth);

      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log("Uploading files:", files.length);

      // Upload files
      const uploadResponse = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload result:", uploadResult);

      setUploadProgress(100);
      setUploadStatus({
        success: true,
        message: uploadResult.message,
        fileCount: uploadResult.file_count,
      });

      // Start processing with slight delay
      setTimeout(async () => {
        try {
          console.log("Starting processing...");
          setProcessingProgress(5);
          setProcessingStatus("Initializing...");

          const processingResponse = await fetch(
            "http://localhost:8000/process/process?" +
              new URLSearchParams({
                client_name: clientName,
                month: formattedMonth,
              }),
            {
              method: "POST",
            }
          );

          console.log("Processing response status:", processingResponse.status);

          if (!processingResponse.ok) {
            const errorData = await processingResponse.json();
            throw new Error(errorData.detail || "Processing failed");
          }

          const processingResult = await processingResponse.json();
          console.log("Processing result:", processingResult);

          const newSessionId = processingResult.session_id;
          setSessionId(newSessionId);
          setProcessingProgress(10);

          // Start polling progress
          progressIntervalRef.current = setInterval(() => {
            pollProcessingProgress(newSessionId);
          }, 1000);
        } catch (err) {
          console.error("Processing error:", err);
          setError(err.message || "An error occurred during processing");
          setIsProcessing(false);
          setLoading(false);
        }
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred");
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="mt-8 !bg-white rounded-xl shadow p-6">
      <form onSubmit={handleSubmit}>
        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client Name *
          </label>
          <input
            ref={clientNameInputRef}
            type="text"
            placeholder="e.g., ABC_Enterprises"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-2 w-full border-2 border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use underscores instead of spaces
          </p>
        </div>

        {/* Month */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Tax Period (Month) *
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-2 w-full border-2 border-gray-300 rounded-md px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Select the month and year for processing
          </p>
        </div>

        {/* Selected Files Summary */}
        {files.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selected Files ({files.length}) *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 16a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2zm-1-12h2v8h-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-400 hover:text-red-700 text-sm font-medium flex-shrink-0 disabled:opacity-50"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {files.length} file(s) ready to process
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              📤 Uploading Documents
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {uploadProgress}% - {uploadProgress === 100 ? "Upload complete!" : "Uploading..."}
            </p>
          </div>
        )}

        {/* Upload Success */}
        {uploadStatus?.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ {uploadStatus.message}
            </p>
            <p className="text-sm text-green-600">
              {uploadStatus.fileCount} file(s) uploaded successfully
            </p>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              ⚙️ Processing Documents with AI
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Status: <span className="font-medium capitalize">{processingStatus}</span>
            </p>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {processingProgress}% - {processingProgress === 100 ? "Processing complete!" : "Processing..."}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 mt-3">
              <div className="animate-spin">⏳</div>
              <span>Extracting text and analyzing invoices with Gemini AI...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={loading}
            className="flex-1 py-3 border-2 border-gray-300 text-white font-semibold rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || files.length === 0 || isProcessing}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition disabled:cursor-not-allowed"
          >
            {isProcessing ? `Processing... ${processingProgress}%` : loading ? "Uploading..." : "Process Documents"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
