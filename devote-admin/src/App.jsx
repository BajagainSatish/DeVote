import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DefaultLayout from "./layout/DefaultLayout";
import Dashboard from "./pages/Admin/Dashboard";
import AddCandidate from "./pages/Admin/AddCandidate";
import ViewCandidates from "./pages/Admin/ViewCandidates";
import AdminLogin from "./pages/Admin/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        </Route>
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;