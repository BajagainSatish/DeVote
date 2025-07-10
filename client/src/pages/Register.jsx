import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ballotBoxImageUrl from "../assets/VotingBallot.svg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Register = () => {
  const [formData, setFormData] = useState({
    voterId: "",
    name: "",
    dob: "",
    location: "",
    email: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, voterId, name, dob, location } = formData;

    try {
      const res = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, voterId, name, dob, location }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Registration failed");
      }

      const data = await res.json();
      alert(
        `Registration successful!\nYour username: ${data.username}\nYour password: ${data.password}`
      );
      navigate("/login");
    } catch (err) {
      alert("Error: " + err.message);
    }
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
              <label htmlFor="voterId" className="block mb-1 text-sm font-semibold text-gray-800">
                Voter ID
              </label>
              <input
                type="text"
                id="voterId"
                name="voterId"
                placeholder="e.g. V1234567"
                value={formData.voterId}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-semibold text-gray-800">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ram Bahadur"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block mb-1 text-sm font-semibold text-gray-800">
                Date of Birth
              </label>
              <input
                type="date"//provides value in yyyy-mm-dd format which is used by voters.json eg: "DOB": "1990-01-01",
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label htmlFor="location" className="block mb-1 text-sm font-semibold text-gray-800">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Kathmandu"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-semibold text-gray-800">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="abc@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-100 rounded-md px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21978B]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#21978B] text-white py-2.5 rounded-md font-semibold cursor-pointer"
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
