import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiService from "../../services/api";
import { UseAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = UseAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stats, status] = await Promise.all([
        apiService.getElectionStatistics(),
        apiService.getElectionStatus(),
      ]);
      setStatistics(stats);
      setElectionStatus(status);
    } catch (error) {
      toast.error("Failed to fetch dashboard data" + error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      toast.success("Logged out successfully");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#21978B]">Admin Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Election Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Election Status</h3>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-full text-white font-semibold ${
              electionStatus?.isActive ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {electionStatus?.isActive ? "ACTIVE" : "INACTIVE"}
          </div>
          <div className="text-gray-700">
            {electionStatus?.status?.description || "No description available"}
          </div>
        </div>
        {electionStatus?.status?.startTime && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Start Time:</strong>{" "}
              {new Date(electionStatus.status.startTime).toLocaleString()}
            </div>
            <div>
              <strong>End Time:</strong>{" "}
              {new Date(electionStatus.status.endTime).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-[#21978B]">
                {statistics?.totalCandidates || 0}
              </p>
            </div>
            <div className="bg-[#21978B] bg-opacity-10 p-3 rounded-full">
              <svg className="w-6 h-6 text-[#21978B]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Parties</p>
              <p className="text-2xl font-bold text-[#21978B]">
                {statistics?.totalParties || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registered Voters</p>
              <p className="text-2xl font-bold text-[#21978B]">
                {statistics?.totalVoters || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-[#21978B]">
                {statistics?.totalVotes || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-[#21978B] text-white p-4 rounded-lg hover:bg-[#18BC9C] transition">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <p className="font-semibold">Add Candidate</p>
            </div>
          </button>
          
          <button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <p className="font-semibold">Manage Parties</p>
            </div>
          </button>
          
          <button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Election Control</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;