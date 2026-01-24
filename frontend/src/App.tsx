import { Routes, Route } from 'react-router-dom'
import Landing from "./pages/landing"
import Upload from "./pages/upload"
import Report from "./pages/report"
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/report" element={<Report />} />
        {/* Add more routes here as needed */}
      </Routes>
    </div>
  )
}

export default App
