import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const UploadForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize state from location.state if available
  const [clientName, setClientName] = useState(
    location.state?.folderName || ""
  );
  const [month, setMonth] = useState("");
  const [files, setFiles] = useState(location.state?.selectedFiles || []);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);
  const clientNameInputRef = useRef(null);

  // Focus input when component mounts with folder name
  useEffect(() => {
    if (location.state?.folderName && clientNameInputRef.current) {
      setTimeout(() => {
        clientNameInputRef.current?.focus();
        clientNameInputRef.current?.select();
      }, 100);
    }
  }, [location.state?.folderName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientName.trim() || !month || files.length === 0) {
      setError("Please fill all fields and select files");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatus(null);

    try {
      // Convert month from YYYY-MM format to YYYY_MM format
      const formattedMonth = month.replace("-", "_");
      
      const formData = new FormData();
      formData.append("client_name", clientName);
      formData.append("month", formattedMonth);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();
      
      setUploadStatus({
        success: true,
        message: result.message,
        fileCount: result.file_count,
      });

      // Reset form
      setClientName("");
      setMonth("");
      setFiles([]);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow p-6">
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
            className="mt-2 w-full border-2 border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Use underscores instead of spaces</p>
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
            className="mt-2 w-full border-2 border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM</p>
        </div>

        {/* Selected Files Summary */}
        {files.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selected Files ({files.length}) *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                  <div className="flex items-center flex-1 min-w-0">
                    <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 16a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2zm-1-12h2v8h-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium flex-shrink-0"
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

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus?.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">{uploadStatus.message}</p>
            <p className="text-sm text-green-600">{uploadStatus.fileCount} file(s) uploaded successfully</p>
            <p className="text-xs text-green-600 mt-2">Redirecting to home page...</p>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={loading}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!clientName || !month || files.length === 0 || loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition"
          >
            {loading ? "Uploading..." : "Process Documents"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
