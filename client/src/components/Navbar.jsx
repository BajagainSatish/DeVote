"use client";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UseAuth } from "../context/AuthContext";

const Navbar = () => {
  const { username, logout } = UseAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/");
  };

  const scrollToSection = (id) => {
    navigate("/");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <nav className="bg-white border-b border-white shadow-md">
      <div className="flex items-center justify-between px-4 sm:px-12 py-4">
        {username ? (
          <span className="text-xl font-bold text-gray-900 cursor-default">
            DeVote
          </span>
        ) : (
          <Link to="/" className="text-xl font-bold text-gray-900">
            DeVote
          </Link>
        )}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>

        <div className="hidden md:flex md:items-center md:gap-10">
          {username ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/vote"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Vote
              </Link>
              <Link
                to="/results"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Results
              </Link>
              <Link
                to="/blockchain"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Blockchain Explorer
              </Link>
            </>
          ) : (
            <>
              <span
                className="text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => scrollToSection("home")}
              >
                Home
              </span>
              <span
                className="text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => scrollToSection("features")}
              >
                Features
              </span>
              <span
                className="text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => scrollToSection("how-it-works")}
              >
                How it Works
              </span>
              <span
                className="text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => scrollToSection("contact")}
              >
                Contact
              </span>
            </>
          )}
        </div>

        <div className="hidden md:flex md:gap-4 md:items-center">
          {username ? (
            <>
              <span className="text-gray-700 font-medium">
                Welcome, {username}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-[#21978B] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#18BC9C] transition"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="bg-[#21978B] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#18BC9C] transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {username ? (
            <>
              <Link
                to="/dashboard"
                className="block text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/vote"
                className="block text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Vote
              </Link>
              <Link
                to="/results"
                className="block text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Results
              </Link>
              <Link
                to="/blockchain"
                className="block text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Blockchain Explorer
              </Link>
              <span className="block text-gray-700 font-medium">
                Welcome, {username}
              </span>
              <button
                onClick={handleLogout}
                className="block w-full bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <span
                className="block text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  scrollToSection("home");
                }}
              >
                Home
              </span>
              <span
                className="block text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  scrollToSection("features");
                }}
              >
                Features
              </span>
              <span
                className="block text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  scrollToSection("how-it-works");
                }}
              >
                How it Works
              </span>
              <span
                className="block text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  scrollToSection("contact");
                }}
              >
                Contact
              </span>
              <Link
                to="/register"
                className="block w-full bg-[#21978B] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18BC9C] transition"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="block w-full bg-[#21978B] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18BC9C] transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
