import { Routes, Route } from "react-router-dom";
import DefaultLayout from "./layout/DefaultLayout";
import Dashboard from "./pages/Admin/Dashboard";
import AddCandidate from "./pages/Admin/AddCandidate";
import ViewCandidates from "./pages/Admin/ViewCandidates";
import { ToastContainer } from "react-toastify";
import AdminLogin from "./pages/Admin/AdminLogin";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route element={<DefaultLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates/add" element={<AddCandidate />} />
          <Route path="/candidates/view" element={<ViewCandidates />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
