// devote-admin/src/App.jsx


import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DefaultLayout from "./layout/DefaultLayout";
import Dashboard from "./pages/Admin/Dashboard";
import AddCandidate from "./pages/Admin/AddCandidate";
import ViewCandidates from "./pages/Admin/ViewCandidates";
import ManageParties from "./pages/Admin/ManageParties";
import ElectionManagement from "./pages/Admin/ElectionManagement";
import AdminLogin from "./pages/Admin/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManageVoters from "./pages/Admin/ManageVoters";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
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
          <Route path="election/manage" element={<ElectionManagement />} />
          <Route path="voters/manage" element={<ManageVoters />} />
        </Route>
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;