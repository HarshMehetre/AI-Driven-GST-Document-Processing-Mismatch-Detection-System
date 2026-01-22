import UploadForm from "../components/UploadForm";

const Upload = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Upload GST Documents
        </h1>
        <p className="mt-2 text-gray-600">
          Upload invoice files for a specific client and tax period.
        </p>

        <UploadForm />
      </div>
    </main>
  );
};

export default Upload;
