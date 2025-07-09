import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, voterId, password, confirmPassword } = form;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    //Ya chai backend sanga integrate garne

    // Backend xaina aile so temporary simulation
    alert("Simulated registration successful!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F3F2]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-6">
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
                htmlFor="voterId"
                className="block mb-1 text-sm font-semibold text-gray-800"
              >
                VoterId
              </label>
              <input
                type="text"
                id="voterId"
                name="voterId"
                placeholder="25243608"
                value={formData.voterId}
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
