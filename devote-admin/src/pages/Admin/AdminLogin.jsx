// devote-admin/pages/Admin/AdminLogin.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UseAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = UseAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        toast.success("Login successful!");
        setFormData({ email: "", password: "" });
        navigate("/dashboard");
      } else {
        toast.error("Login failed! Invalid credentials.");
      }
    } catch (error) {
      toast.error("An error occurred during login" + error);
      setFormData({ email: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3F2] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-[#21978B] mb-6">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-800">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
              placeholder="admin@devote.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-800">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#21978B] text-white py-2.5 rounded font-semibold hover:bg-[#18BC9C] transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
