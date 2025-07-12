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
    <nav className="bg-[#21978B] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold">
            DeVote
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-[#18BC9C] transition">
              Home
            </Link>
            {username ? (
              <>
                <Link to="/dashboard" className="hover:text-[#18BC9C] transition">
                  Dashboard
                </Link>
                <Link to="/vote" className="hover:text-[#18BC9C] transition">
                  Vote
                </Link>
                <Link to="/results" className="hover:text-[#18BC9C] transition">
                  Results
                </Link>
                <Link to="/blockchain" className="hover:text-[#18BC9C] transition">
                  Blockchain
                </Link>
              </>
            ) : (
              <>
                <Link to="/results" className="hover:text-[#18BC9C] transition">
                  Results
                </Link>
                <Link to="/blockchain" className="hover:text-[#18BC9C] transition">
                  Blockchain
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {username ? (
              <>
                <span className="text-sm">Welcome, {username}</span>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition">
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link to="/login" className="bg-white text-[#21978B] px-4 py-2 rounded hover:bg-gray-100 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-[#18BC9C] px-4 py-2 rounded hover:bg-[#16A085] transition">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
