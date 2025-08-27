"use client"

// devote-admin/pages/Admin/ElectionManagement.jsx

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import apiService from "../../services/api"

export default function ElectionManagement() {
  const [electionStatus, setElectionStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStartForm, setShowStartForm] = useState(false)
  const [startFormData, setStartFormData] = useState({
    description: "",
    durationHours: 24,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [status, resultsData] = await Promise.all([apiService.getElectionStatus(), apiService.getElectionResults()])
      setElectionStatus(status)
      setResults(resultsData)
    } catch (error) {
      toast.error("Failed to fetch election data" + error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartElection = async (e) => {
    e.preventDefault()

    try {
      await apiService.startElection(startFormData)

      // Get all localStorage keys that start with "voted_"
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("voted_")) {
          keysToRemove.push(key)
        }
      }

      // Remove all voting records
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      toast.success("Election started successfully - All voting records have been reset")
      setShowStartForm(false)
      fetchData()
    } catch (error) {
      toast.error(error.message || "Failed to start election")
    }
  }

  const handleStopElection = async () => {
    if (!window.confirm("Are you sure you want to stop the election?")) {
      return
    }

    try {
      await apiService.stopElection()
      toast.success("Election stopped successfully")
      fetchData()
    } catch (error) {
      toast.error(error.message || "Failed to stop election")
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setStartFormData((prev) => ({
      ...prev,
      [name]: name === "durationHours" ? Number.parseInt(value) : value,
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading election data...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#21978B] mb-6">Election Management</h2>

      {/* Election Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Current Election Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-full text-white font-semibold ${
                electionStatus?.isActive ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {electionStatus?.isActive ? "ACTIVE" : "INACTIVE"}
            </div>
            <div className="text-gray-700">{electionStatus?.status?.description || "No description available"}</div>
          </div>

          <div className="flex gap-2">
            {!electionStatus?.isActive ? (
              <button
                onClick={() => setShowStartForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Start Election
              </button>
            ) : (
              <button
                onClick={handleStopElection}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Stop Election
              </button>
            )}
          </div>
        </div>

        {electionStatus?.status?.startTime && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded">
            <div>
              <strong>Start Time:</strong> {new Date(electionStatus.status.startTime).toLocaleString()}
            </div>
            <div>
              <strong>End Time:</strong> {new Date(electionStatus.status.endTime).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Start Election Form */}
      {showStartForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Start New Election</h3>
          <form onSubmit={handleStartElection} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Election Description</label>
              <input
                type="text"
                name="description"
                value={startFormData.description}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter election description"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Duration (Hours)</label>
              <input
                type="number"
                name="durationHours"
                value={startFormData.durationHours}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                min="1"
                max="168"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                Start Election
              </button>
              <button
                type="button"
                onClick={() => setShowStartForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Election Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Election Results</h3>

        {results?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{results.statistics.totalCandidates}</p>
              <p className="text-sm text-gray-600">Total Candidates</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{results.statistics.totalVotes}</p>
              <p className="text-sm text-gray-600">Total Votes</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{results.statistics.registeredUsers}</p>
              <p className="text-sm text-gray-600">Registered Voters</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">{results.statistics.totalParties}</p>
              <p className="text-sm text-gray-600">Total Parties</p>
            </div>
          </div>
        )}

        {results?.results && results.results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Rank</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Candidate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Party</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Votes</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {results.results
                  .sort((a, b) => b.votes - a.votes)
                  .map((candidate, index) => {
                    const percentage =
                      results.statistics.totalVotes > 0
                        ? ((candidate.votes / results.statistics.totalVotes) * 100).toFixed(1)
                        : 0

                    return (
                      <tr key={candidate.candidateId} className={index === 0 ? "bg-yellow-50" : ""}>
                        <td className="border border-gray-300 px-4 py-2">
                          {index === 0 && "🏆"} {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex items-center gap-2">
                            {candidate.imageUrl && (
                              <img
                                src={candidate.imageUrl || "/placeholder.svg"}
                                alt={candidate.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            {candidate.name}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{candidate.party}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{candidate.votes}</td>
                        <td className="border border-gray-300 px-4 py-2">{percentage}%</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center">No voting results available yet.</p>
        )}
      </div>
    </div>
  )
}
