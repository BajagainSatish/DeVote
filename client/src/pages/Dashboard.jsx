"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api"

const Dashboard = () => {
  const { username } = UseAuth()
  const navigate = useNavigate()
  const [electionStatus, setElectionStatus] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [parties, setParties] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!username) {
      navigate("/login")
      return
    }
    loadDashboardData()
  }, [username, navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statusData, candidatesData, partiesData, statsData] = await Promise.all([
        VotingApiService.getElectionStatus(),
        VotingApiService.getCandidates(),
        VotingApiService.getParties(),
        VotingApiService.getElectionResults(), // This includes statistics
      ])

      setElectionStatus(statusData)
      setCandidates(candidatesData || [])
      setParties(partiesData || [])
      setStatistics(statsData.statistics || null)

      // Check if user has already voted (you might want to add this to your backend)
      // For now, we'll check localStorage
      const votedStatus = localStorage.getItem(`voted_${username}`)
      setHasVoted(!!votedStatus)
    } catch (err) {
      setError("Failed to load dashboard data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Your Dashboard</h1>
          <p className="text-gray-600">Manage your voting experience and stay updated on the election.</p>
          <p className="text-sm text-gray-500 mt-2">Logged in as: {username}</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Election Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Election Status</h3>
            {electionStatus ? (
              <div>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    electionStatus.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {electionStatus.isActive ? "Active" : "Inactive"}
                </div>
                <p className="text-gray-600 mt-2">{electionStatus.status.description}</p>
                {electionStatus.isActive && electionStatus.status.endTime && (
                  <p className="text-sm text-gray-500 mt-1">
                    Ends: {new Date(electionStatus.status.endTime).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No election data available</p>
            )}
          </div>

          {/* Voting Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Voting Status</h3>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                hasVoted ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {hasVoted ? "Vote Cast" : "Not Voted"}
            </div>
            <p className="text-gray-600 mt-2">
              {hasVoted
                ? "Thank you for participating in the election!"
                : "You can cast your vote when the election is active."}
            </p>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Election Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Candidates:</span>
                <span className="font-medium">{candidates.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parties:</span>
                <span className="font-medium">{parties.length}</span>
              </div>
              {statistics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered Users:</span>
                    <span className="font-medium">{statistics.registeredUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Votes:</span>
                    <span className="font-medium">{statistics.totalVotes || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#21978B]">{statistics.totalCandidates}</div>
                <div className="text-gray-600">Candidates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#21978B]">{statistics.totalParties}</div>
                <div className="text-gray-600">Parties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#21978B]">{statistics.registeredUsers}</div>
                <div className="text-gray-600">Registered Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#21978B]">{statistics.totalVotes}</div>
                <div className="text-gray-600">Total Votes</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/vote")}
              disabled={!electionStatus?.isActive || hasVoted}
              className={`px-6 py-3 rounded-md font-semibold transition ${
                electionStatus?.isActive && !hasVoted
                  ? "bg-[#21978B] text-white hover:bg-[#18BC9C]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {hasVoted ? "Already Voted" : "Cast Your Vote"}
            </button>

            <button
              onClick={() => navigate("/results")}
              className="px-6 py-3 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition"
            >
              View Results
            </button>

            <button
              onClick={loadDashboardData}
              className="px-6 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Candidates Preview */}
        {candidates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Candidates in this Election</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.slice(0, 6).map((candidate) => (
                <div key={candidate.candidateId} className="border border-gray-200 rounded-lg p-4">
                  {candidate.imageUrl && (
                    <img
                      src={candidate.imageUrl || "/placeholder.svg"}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                  )}
                  <h4 className="font-semibold text-center text-gray-800">{candidate.name}</h4>
                  <p className="text-sm text-gray-600 text-center">{candidate.partyName || "Independent"}</p>
                  {candidate.bio && (
                    <p className="text-xs text-gray-500 text-center mt-2 line-clamp-2">{candidate.bio}</p>
                  )}
                </div>
              ))}
            </div>
            {candidates.length > 6 && (
              <div className="text-center mt-4">
                <button onClick={() => navigate("/vote")} className="text-[#21978B] hover:underline font-medium">
                  View All Candidates
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Dashboard
