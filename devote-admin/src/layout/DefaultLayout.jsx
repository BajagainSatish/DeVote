import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const DefaultLayout = ({ children }) => {
  return (
    <>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md h-[90vh] rounded-xl m-4 mt-8 p-4">
          <NavLink to={"/dashboard"}>
            <h2 className="text-xl font-bold text-[#21978B] mb-6 text-center">
              DeVote Admin
            </h2>
          </NavLink>
          <nav className="flex flex-col space-y-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/candidates/add"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              Add Candidate
            </NavLink>
            <NavLink
              to="/candidates/view"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              View Candidates
            </NavLink>
            <NavLink
              to="/parties/manage"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              Manage Parties
            </NavLink>
            <NavLink
              to="/election/manage"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              Election Control
            </NavLink>
            <NavLink
              to="/voters/manage"
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-[#21978B] hover:text-white ${
                  isActive ? "bg-[#21978B] text-white" : "text-gray-800"
                }`
              }
            >
              Manage Voters
            </NavLink>
          </nav>
        </aside>
        {/* main content area  */}
        <main className="flex-1 p-6">{children || <Outlet />}</main>
      </div>
    </>
  );
};

export default DefaultLayout;