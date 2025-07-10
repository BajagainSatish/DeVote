"use client"
import React from "react"

import { useEffect, useState } from "react"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api"

const Results = () => {
  const [results, setResults] = useState([])
  const [electionStatus, setElectionStatus] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      const [resultsData, statusData] = await Promise.all([
        VotingApiService.getElectionResults(),
        VotingApiService.getElectionStatus(),
      ])

      setResults(resultsData.results || [])
      setElectionStatus(statusData)
      setStatistics(resultsData.statistics)
    } catch (err) {
      setError("Failed to load results: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0)
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-xl text-gray-600">Loading results...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Election Results</h1>
          <p className="text-gray-600">Live results and statistics from the current election</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Election Status */}
        {electionStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Election Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600">Status:</span>
                <div
                  className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                    electionStatus.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {electionStatus.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Votes Cast:</span>
                <span className="ml-2 font-semibold">{totalVotes}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Candidates:</span>
                <span className="ml-2 font-semibold">{results.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Election Statistics</h2>
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
                <div className="text-2xl font-bold text-[#21978B]">{statistics.totalUsers}</div>
                <div className="text-gray-600">Registered Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#21978B]">{statistics.votedUsers}</div>
                <div className="text-gray-600">Votes Cast</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Candidate Results</h2>

          {sortedResults.length > 0 ? (
            <div className="space-y-4">
              {sortedResults.map((candidate, index) => {
                const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
                const isWinner = index === 0 && candidate.votes > 0

                return (
                  <div
                    key={candidate.candidateId}
                    className={`p-4 rounded-lg border ${
                      isWinner ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        {isWinner && (
                          <div className="text-yellow-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {candidate.name}
                            {isWinner && <span className="ml-2 text-sm text-yellow-600 font-medium">Leading</span>}
                          </h3>
                          <p className="text-gray-600">{candidate.party}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{candidate.votes}</div>
                        <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isWinner ? "bg-yellow-400" : "bg-[#21978B]"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No results available yet.</p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadResults}
            className="px-6 py-3 bg-[#21978B] text-white rounded-md font-semibold hover:bg-[#18BC9C] transition"
          >
            Refresh Results
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Results
