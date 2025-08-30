//Navbar.jsx

"use client"
import React from "react"

import { Link, useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"

const Navbar = () => {
  const { username, logout } = UseAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    logout()
    navigate("/")
  }

  return (
    <nav className="flex items-center justify-between px-12 py-4 border-b border-white bg-white shadow-md">
      <Link to="/" className="text-xl font-bold text-gray-900">
        DeVote
      </Link>

      {username ? (
        // Logged in user navigation
        <ul className="flex gap-10 text-gray-700 font-medium">
          <li>
            <Link to="/dashboard" className="hover:text-gray-900 cursor-pointer">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/vote" className="hover:text-gray-900 cursor-pointer">
              Vote
            </Link>
          </li>
          <li>
            <Link to="/anonymous-vote" className="hover:text-blue-600 cursor-pointer font-semibold">
              Anonymous Vote
            </Link>
          </li>
          <li>
            <Link to="/results" className="hover:text-gray-900 cursor-pointer">
              Results
            </Link>
          </li>
          <li>
            <Link to="/blockchain" className="hover:text-gray-900 cursor-pointer">
              Blockchain Explorer
            </Link>
          </li>
          <li>
            <Link to="/flow-diagram" className="hover:text-purple-600 cursor-pointer">
              Flow Diagram
            </Link>
          </li>

        </ul>
      ) : (
        // Guest navigation
        <ul className="flex gap-10 text-gray-700 font-medium">
          <li className="hover:text-gray-900 cursor-pointer">Home</li>
          <li className="hover:text-gray-900 cursor-pointer">Features</li>
          <li className="hover:text-gray-900 cursor-pointer">How it Works</li>
          <li className="hover:text-gray-900 cursor-pointer">Contact</li>
        </ul>
      )}

      <div className="flex gap-4 items-center">
        {username ? (
          <>
            <span className="text-gray-700 font-medium">Welcome, {username}</span>
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
    </nav>
  )
}

export default Navbar
