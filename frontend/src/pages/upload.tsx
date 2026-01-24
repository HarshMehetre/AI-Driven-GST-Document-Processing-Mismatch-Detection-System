import UploadForm from "../components/UploadForm";
import { useState } from "react";

const Upload = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 This function connects to FastAPI
  const handleUpload = async ({ clientName, month, files }) => {
    if (!clientName || !month || files.length === 0) {
      setMessage("❌ Please fill all fields and select files");
      return;
    }

    const formData = new FormData();
    formData.append("client_name", clientName);
    formData.append("month", month);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setMessage(`✅ ${data.file_count} files uploaded successfully`);
    } catch (error) {
      console.error(error);
      setMessage("❌ Error uploading files");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-200 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Upload GST Documents
        </h1>
        <p className="mt-2 text-gray-600">
          Upload invoice files for a specific client and tax period.
        </p>

        {/* 👇 UI stays same, logic injected */}
        <UploadForm onSubmit={handleUpload} loading={loading} />

        {message && (
          <p className="mt-4 text-center font-medium">{message}</p>
        )}
      </div>
    </main>
  );
};

export default Upload;
