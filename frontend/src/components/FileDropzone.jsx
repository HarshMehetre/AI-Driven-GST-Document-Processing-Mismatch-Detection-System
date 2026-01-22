import { useRef } from "react";

const FileDropzone = ({ files, setFiles }) => {
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => {
    setFiles([...files, ...Array.from(newFiles)]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Invoice Files (PDF / Images)
      </label>

      <div
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 py-12 text-center cursor-pointer hover:border-blue-500 transition"
      >
        <p className="text-gray-600">
          Drag & drop invoice files here or click to browse
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Selected files */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {files.map((file, index) => (
            <li key={index}>📄 {file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileDropzone;
