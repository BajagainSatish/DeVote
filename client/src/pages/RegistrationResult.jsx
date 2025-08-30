import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Clipboard, ClipboardCheck } from "lucide-react"; // ✅ Icons

const RegistrationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { success, username, password, message } = state || {};

  const [copiedField, setCopiedField] = useState(null); // "username" | "password" | null

  const handleCopy = (value, field) => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopiedField(field);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F3F2]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="bg-white rounded-xl shadow-md px-6 py-8 w-full max-w-md text-center">
          {success ? (
            <>
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Registration Successful!
              </h2>

              {/* Username with copy */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <p>
                  Your username: <strong>{username}</strong>
                </p>
                <button
                  onClick={() => handleCopy(username, "username")}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                  title="Copy username"
                >
                  {copiedField === "username" ? (
                    <ClipboardCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clipboard className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password with copy */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <p>
                  Your password: <strong>{password}</strong>
                </p>
                <button
                  onClick={() => handleCopy(password, "password")}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                  title="Copy password"
                >
                  {copiedField === "password" ? (
                    <ClipboardCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clipboard className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="mt-2 bg-[#21978B] text-white py-2 px-4 rounded-md hover:bg-[#1a7a70] transition"
              >
                Go to Login
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Registration Failed
              </h2>
              <p>{message || "Something went wrong."}</p>
              <button
                onClick={() => navigate("/register")}
                className="mt-4 bg-[#21978B] text-white py-2 px-4 rounded-md hover:bg-[#1a7a70] transition"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationResult;
