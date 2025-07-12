"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api"

const BlockchainExplorer = () => {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: "",
    limit: "50",
  })
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [notifications, setNotifications] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (realTimeEnabled) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }

    return () => disconnectWebSocket()
  }, [realTimeEnabled])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transactionsData, statsData] = await Promise.all([
        VotingApiService.getTransactions(filters),
        VotingApiService.getBlockchainStats(),
      ])

      setTransactions(transactionsData || [])
      setStats(statsData)
    } catch (error) {
      console.error("Failed to fetch blockchain data:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    if (wsRef.current) return

    wsRef.current = VotingApiService.connectWebSocket((data) => {
      if (data.type === "new_transaction") {
        setTransactions((prev) => [data.data, ...prev])

        // Add notification
        const notification = {
          id: Date.now(),
          message: getTransactionSummary(data.data),
          timestamp: new Date(),
          type: data.data.data.type,
        }
        setNotifications((prev) => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
        }, 10000)
      }
    })
  }

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    fetchData()
  }

  const verifyBlockchain = async () => {
    try {
      const result = await VotingApiService.verifyBlockchain()
      setVerificationResult(result)
    } catch (error) {
      console.error("Failed to verify blockchain:", error)
    }
  }

  const getTransactionSummary = (tx) => {
    switch (tx.data.type) {
      case "VOTE":
        return `A vote was cast for ${tx.data.target}`
      case "VOTER_REGISTER":
        return `New voter registered`
      case "ADD_CANDIDATE":
        return `New candidate added: ${tx.data.target}`
      case "UPDATE_CANDIDATE":
        return `Candidate updated: ${tx.data.target}`
      case "DELETE_CANDIDATE":
        return `Candidate removed: ${tx.data.target}`
      case "ADD_PARTY":
        return `New party added: ${tx.data.target}`
      case "UPDATE_PARTY":
        return `Party updated: ${tx.data.target}`
      case "DELETE_PARTY":
        return `Party removed: ${tx.data.target}`
      case "START_ELECTION":
        return `Election started: ${tx.data.action}`
      case "STOP_ELECTION":
        return `Election stopped`
      case "DELETE_VOTER":
        return `Registered voter removed`
      default:
        return tx.data.action || "System action"
    }
  }

  const getTransactionTypeColor = (type) => {
    const colors = {
      VOTE: "bg-green-100 text-green-800",
      VOTER_REGISTER: "bg-blue-100 text-blue-800",
      ADD_CANDIDATE: "bg-purple-100 text-purple-800",
      UPDATE_CANDIDATE: "bg-yellow-100 text-yellow-800",
      DELETE_CANDIDATE: "bg-red-100 text-red-800",
      ADD_PARTY: "bg-indigo-100 text-indigo-800",
      UPDATE_PARTY: "bg-orange-100 text-orange-800",
      DELETE_PARTY: "bg-red-100 text-red-800",
      START_ELECTION: "bg-green-100 text-green-800",
      STOP_ELECTION: "bg-red-100 text-red-800",
      DELETE_VOTER: "bg-red-100 text-red-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const getTransactionIcon = (type) => {
    const icons = {
      VOTE: "🗳️",
      VOTER_REGISTER: "👤",
      ADD_CANDIDATE: "➕",
      UPDATE_CANDIDATE: "✏️",
      DELETE_CANDIDATE: "❌",
      ADD_PARTY: "🏛️",
      UPDATE_PARTY: "🔄",
      DELETE_PARTY: "🗑️",
      START_ELECTION: "🚀",
      STOP_ELECTION: "⏹️",
      DELETE_VOTER: "👥",
    }
    return icons[type] || "📝"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-xl text-gray-600">Loading blockchain data...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar />

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white border-l-4 border-[#21978B] rounded-lg shadow-lg p-4 max-w-sm animate-slide-in"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{getTransactionIcon(notification.type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Activity</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Blockchain Explorer</h1>
          <p className="text-gray-600">Complete transparency of all election activities</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Total Blocks</h3>
              <p className="text-2xl font-bold text-[#21978B]">{stats.totalBlocks}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
              <p className="text-2xl font-bold text-[#21978B]">{stats.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Chain Integrity</h3>
              <p className={`text-2xl font-bold ${stats.chainIntegrity ? "text-green-600" : "text-red-600"}`}>
                {stats.chainIntegrity ? "✓ VALID" : "✗ INVALID"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Real-time Updates</h3>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                  className="rounded mr-2"
                />
                <span className="text-sm">{realTimeEnabled ? "ON" : "OFF"}</span>
              </label>
            </div>
          </div>
        )}

        {/* Verification Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Blockchain Verification</h3>
            <button
              onClick={verifyBlockchain}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Verify Now
            </button>
          </div>

          {verificationResult && (
            <div
              className={`p-4 rounded-lg ${verificationResult.valid ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{verificationResult.valid ? "✅" : "❌"}</span>
                <h4 className="font-semibold">Blockchain is {verificationResult.valid ? "VALID" : "INVALID"}</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Verified At:</p>
                  <p>{new Date(verificationResult.verifiedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Total Blocks:</p>
                  <p>{verificationResult.totalBlocks}</p>
                </div>
                <div>
                  <p className="font-medium">Total Transactions:</p>
                  <p>{verificationResult.totalTransactions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Filter Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Activities</option>
                <option value="VOTE">Votes</option>
                <option value="VOTER_REGISTER">Voter Registration</option>
                <option value="ADD_CANDIDATE">Add Candidate</option>
                <option value="UPDATE_CANDIDATE">Update Candidate</option>
                <option value="DELETE_CANDIDATE">Delete Candidate</option>
                <option value="ADD_PARTY">Add Party</option>
                <option value="UPDATE_PARTY">Update Party</option>
                <option value="DELETE_PARTY">Delete Party</option>
                <option value="START_ELECTION">Start Election</option>
                <option value="STOP_ELECTION">Stop Election</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Records</label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="bg-[#21978B] text-white px-6 py-2 rounded hover:bg-[#18BC9C] transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Activity History</h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete record of all election activities stored on the blockchain
            </p>
          </div>

          <div className="p-6">
            {transactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No activities found.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <span className="text-2xl">{getTransactionIcon(tx.data.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.data.type)}`}
                            >
                              {tx.data.type.replace("_", " ")}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(tx.data.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{getTransactionSummary(tx)}</p>
                          <p className="text-xs text-gray-500">Transaction ID: {tx.id.substring(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="text-[#21978B] hover:text-[#18BC9C] text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Activity Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTransactionIcon(selectedTransaction.data.type)}</span>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(selectedTransaction.data.type)}`}
                  >
                    {selectedTransaction.data.type.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-lg">{getTransactionSummary(selectedTransaction)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">{selectedTransaction.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p>{new Date(selectedTransaction.data.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actor</label>
                  <p>
                    {selectedTransaction.data.actor === "admin"
                      ? "System Administrator"
                      : selectedTransaction.data.actor}
                  </p>
                </div>
              </div>

              {selectedTransaction.data.details && Object.keys(selectedTransaction.data.details).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                  <div className="bg-gray-100 p-3 rounded text-sm">
                    {Object.entries(selectedTransaction.data.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="font-medium">{key}:</span>
                        <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default BlockchainExplorer
