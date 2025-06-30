import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-12 py-4 border-b border-white bg-white shadow-md">
      <Link to="/" className="text-xl font-bold text-gray-900">
        DeVote
      </Link>
      <ul className="flex gap-10 text-gray-700 font-medium">
        <li className="hover:text-gray-900 cursor-pointer">Home</li>
        <li className="hover:text-gray-900 cursor-pointer">Features</li>
        <li className="hover:text-gray-900 cursor-pointer">How it Works</li>
        <li className="hover:text-gray-900 cursor-pointer">Contact</li>
      </ul>
      <div className="flex gap-4">
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
      </div>
    </nav>
  );
};

export default Navbar;
