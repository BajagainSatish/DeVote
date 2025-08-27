//client/src/pages/Login.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ballotBoxImageUrl from "../assets/VotingBallot.svg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { UseAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = UseAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { username, password } = formData;

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }), //this payload is sent to backend
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Invalid credentials.");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token); // Save JWT
      login({ username }); // Update context
      navigate("/vote"); // Redirect to vote page
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F3F2]">
      <Navbar />

      {/* <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="hidden md:flex md:w-1/2 justify-start">
          <img
            src={ballotBoxImageUrl}
            alt="Ballot Box"
            className="max-w-[505px] md:max-w-sm"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md px-6 py-4 w-full max-w-sm">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex-grow text-center">
              Login
            </h2>
          </div>

          {error && (
            <div className="mb-4 text-red-600 font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Username
              </label>
              <input
                type="username"
                id="username"
                name="username"
                autoComplete="username"
                placeholder="voter_<voterID>"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#21978B] text-white py-2.5 rounded-md font-semibold cursor-pointer"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-md text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register
            </Link>
          </p>
        </div>
      </main> */}
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="hidden md:flex md:w-1/2 justify-start">
          <img
            src={ballotBoxImageUrl}
            alt="Ballot Box"
            className="max-w-[505px] md:max-w-sm"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md px-6 py-12 w-full max-w-sm">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex-grow text-center">
              Login
            </h2>
          </div>

          {error && (
            <div className="mb-4 text-red-600 font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Username
              </label>
              <input
                type="username"
                id="username"
                name="username"
                autoComplete="username"
                placeholder="voter_<voterID>"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#21978B] text-white py-2.5 rounded-md font-semibold cursor-pointer"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-md text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
