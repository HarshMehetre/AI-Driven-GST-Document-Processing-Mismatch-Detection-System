import React from 'react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Files uploaded:', files);
      // Handle file upload logic here
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle both files and folders
    const items = e.dataTransfer.items;
    const files = [];
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const entry = items[i].webkitGetAsEntry();
          if (entry) {
            traverseFileTree(entry, files);
          }
        }
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }
    
    if (files.length > 0) {
      console.log('Files/Folders dropped:', files);
      // Handle dropped files/folders here
    }
  };

  const traverseFileTree = (item, files) => {
    if (item.isFile) {
      item.file((file) => {
        files.push(file);
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      dirReader.readEntries((entries) => {
        for (let i = 0; i < entries.length; i++) {
          traverseFileTree(entries[i], files);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-blue-200 to-white">
      {/* Navbar Component */}
      <Navbar />

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Tagline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4" style={{fontFamily: 'Outfit'}}>
            From unstructured invoices to GST-ready data 
            <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> _powered by AI.</span>
          </h1>

          {/* Sub Tagline */}
          <p className="text-base sm:text-lg font-medium text-gray-600 mb-8 max-w-2xl mx-auto" style={{fontFamily: 'Inter'}}>
            Upload invoices, extract GST-ready data, detect mismatches, and protect ITC — all in one platform.
          </p>

          {/* Upload Button */}
          <div className="flex flex-col items-center gap-4">
            <label 
              htmlFor="file-upload" 
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Processing Invoices
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              webkitdirectory="true"
              directory="true"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mb-8">
              Supports all file types • No size limits
            </p>

            {/* Drag and Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <svg
                  className={`w-16 h-16 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
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
