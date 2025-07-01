import React, { useState } from "react";
import { Link } from "react-router-dom";
import ballotBoxImageUrl from "../assets/VotingBallot.svg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Register submitted:", formData);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F3F2]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="hidden md:flex md:w-1/2 justify-center">
          <img
            src={ballotBoxImageUrl}
            alt="Ballot Box"
            className="max-w-xs md:max-w-sm"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md px-6 py-4 w-full max-w-sm">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex-grow text-center">
              Register
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="abc@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="dob"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
              <div className="absolute right-3 top-[2.2rem] text-[#518675] pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10m-11 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
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
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#21978B] text-white py-2.5 rounded-md font-semibold"
            >
              Register
            </button>
          </form>

          <p className="mt-4 text-center text-md text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
