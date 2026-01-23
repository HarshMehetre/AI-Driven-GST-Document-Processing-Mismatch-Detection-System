import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);

  const handleFileSelection = (files) => {
    if (files && files.length > 0) {
      // Extract folder name from webkitRelativePath if available
      let folderName = "";
      const firstFile = files[0];

      if (firstFile.webkitRelativePath) {
        // Get the first folder name from the path
        const pathParts = firstFile.webkitRelativePath.split("/");
        if (pathParts.length > 1) {
          folderName = pathParts[0];
        }
      }

      // Pass files and folder name to upload page via state
      navigate("/upload", {
        state: {
          selectedFiles: Array.from(files),
          folderName: folderName,
        },
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    handleFileSelection(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const traverseFileTree = async (item, files = []) => {
    if (item.isFile) {
      await new Promise((resolve) => {
        item.file((file) => {
          files.push(file);
          resolve();
        });
      });
    } else if (item.isDirectory) {
      const reader = item.createReader();
      const entries = await new Promise((resolve) => {
        reader.readEntries(resolve);
      });

      for (const entry of entries) {
        await traverseFileTree(entry, files);
      }
    }
    return files;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    let allFiles = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        const files = await traverseFileTree(item);
        allFiles = allFiles.concat(files);
      }
    }

    handleFileSelection(allFiles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-blue-200 to-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Tagline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4"
            style={{ fontFamily: "Outfit" }}
          >
            From unstructured invoices to GST-ready data
            <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              _powered by AI.
            </span>
          </h1>

          {/* Sub Tagline */}
          <p
            className="text-base sm:text-lg font-medium text-gray-600 mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: "Inter" }}
          >
            Upload invoices, extract GST-ready data, detect mismatches, and
            protect ITC — all in one platform.
          </p>

          {/* Upload Button */}
          <div className="flex flex-row justify-center items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-40 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Files
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="w-40 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Folder
            </button>
          </div>

          {/* Drag and Drop Area */}
          <div className="mt-10 flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <p className="text-sm text-gray-500 mb-8">
              Supports files & folders • PDF & images
            </p>

            {/* Drag and Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <svg
                  className={`w-16 h-16 mb-4 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-gray-500">
                  or click the button above to browse
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
