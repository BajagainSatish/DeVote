import { Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { AuthProvider } from "./context/AuthContext"
import AdminLogin from "./pages/Admin/AdminLogin"
import Dashboard from "./pages/Admin/Dashboard"
import AddCandidate from "./pages/Admin/AddCandidate"
import ViewCandidates from "./pages/Admin/ViewCandidates";
import ManageParties from "./pages/Admin/ManageParties"
import ManageVoters from "./pages/Admin/ManageVoters"
import ElectionManagement from "./pages/Admin/ElectionManagement"
import BlockchainExplorer from "./pages/Admin/BlockchainExplorer"
import ProtectedRoute from "./components/ProtectedRoute"
import DefaultLayout from "./layout/DefaultLayout" // 👈 Make sure this exists

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<AdminLogin />} />

          {/* Protected Routes with Sidebar (DefaultLayout) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DefaultLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="candidates/add" element={<AddCandidate />} />
            <Route path="candidates/view" element={<ViewCandidates />} />
            <Route path="parties/manage" element={<ManageParties />} />
            <Route path="voters/manage" element={<ManageVoters />} />
            <Route path="election/manage" element={<ElectionManagement />} />
            <Route path="blockchain" element={<BlockchainExplorer />} />
          </Route>
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </AuthProvider>
  )
}

export default App
