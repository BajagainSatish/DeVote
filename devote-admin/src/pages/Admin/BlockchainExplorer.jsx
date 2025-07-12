"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { toast } from "react-toastify"
import apiService from "../../services/api"

export default function BlockchainExplorer() {
  const [transactions, setTransactions] = useState([])
  const [blocks, setBlocks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("transactions")
  const [filters, setFilters] = useState({
    type: "",
    actor: "",
    limit: "50",
  })
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
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
      const [transactionsData, blocksData, statsData] = await Promise.all([
        apiService.getTransactions(filters),
        apiService.getBlockchain(),
        apiService.getBlockchainStats(),
      ])

      setTransactions(transactionsData || [])
      setBlocks(blocksData || [])
      setStats(statsData)
    } catch (error) {
      toast.error("Failed to fetch blockchain data: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    if (wsRef.current) return

    wsRef.current = apiService.connectWebSocket((data) => {
      if (data.type === "new_transaction") {
        setTransactions((prev) => [data.data, ...prev])
        toast.info(`New transaction: ${getTransactionSummary(data.data)}`, {
          position: "top-right",
          autoClose: 5000,
        })
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
      const result = await apiService.verifyBlockchain()
      setVerificationResult(result)
      toast.success(`Blockchain verification: ${result.valid ? "VALID" : "INVALID"}`)
    } catch (error) {
      toast.error("Failed to verify blockchain: " + error.message)
    }
  }

  const getTransactionSummary = (tx) => {
    switch (tx.data.type) {
      case "VOTE":
        return `${tx.data.actor} voted for ${tx.data.target}`
      case "VOTER_REGISTER":
        return `New voter registered: ${tx.data.target}`
      case "ADD_CANDIDATE":
        return `Admin added candidate: ${tx.data.target}`
      case "UPDATE_CANDIDATE":
        return `Admin updated candidate: ${tx.data.target}`
      case "DELETE_CANDIDATE":
        return `Admin deleted candidate: ${tx.data.target}`
      case "ADD_PARTY":
        return `Admin added party: ${tx.data.target}`
      case "UPDATE_PARTY":
        return `Admin updated party: ${tx.data.target}`
      case "DELETE_PARTY":
        return `Admin deleted party: ${tx.data.target}`
      case "START_ELECTION":
        return `Admin started election: ${tx.data.action}`
      case "STOP_ELECTION":
        return `Admin stopped election`
      case "DELETE_VOTER":
        return `Admin deleted registered voter: ${tx.data.target}`
      default:
        return tx.data.action || "Unknown action"
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading blockchain data...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#21978B]">Blockchain Explorer</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={realTimeEnabled}
              onChange={(e) => setRealTimeEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Real-time Updates</span>
          </label>
          <button
            onClick={verifyBlockchain}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Verify Blockchain
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              {stats.chainIntegrity ? "VALID" : "INVALID"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">Last Block</h3>
            <p className="text-sm text-gray-600">
              {stats.lastBlockTime ? new Date(stats.lastBlockTime).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div
          className={`mb-6 p-4 rounded-lg ${verificationResult.valid ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
        >
          <h3 className="font-semibold">Blockchain Verification Result</h3>
          <p>Status: {verificationResult.valid ? "VALID" : "INVALID"}</p>
          <p>Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}</p>
          <p>Total Blocks: {verificationResult.totalBlocks}</p>
          <p>Total Transactions: {verificationResult.totalTransactions}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-[#21978B] text-[#21978B]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "blocks"
                  ? "border-[#21978B] text-[#21978B]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Blocks
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === "transactions" && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">All Types</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                <input
                  type="text"
                  name="actor"
                  value={filters.actor}
                  onChange={handleFilterChange}
                  placeholder="Filter by actor"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
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
                  className="bg-[#21978B] text-white px-4 py-2 rounded hover:bg-[#18BC9C] transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === "transactions" ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No transactions found.</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.data.type)}`}
                            >
                              {tx.data.type}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(tx.data.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{getTransactionSummary(tx)}</p>
                          <p className="text-xs text-gray-500">ID: {tx.id}</p>
                          {tx.data.ipAddress && <p className="text-xs text-gray-500">IP: {tx.data.ipAddress}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Actor</p>
                          <p className="text-sm font-medium">{tx.data.actor}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Block History</h3>
              {blocks.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No blocks found.</p>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block) => (
                    <div key={block.index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold">Block #{block.index}</h4>
                          <p className="text-sm text-gray-500">{block.timestamp}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Transactions</p>
                          <p className="text-lg font-bold text-[#21978B]">{block.transactions.length}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Hash:</p>
                          <p className="font-mono text-xs break-all">{block.hash}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Previous Hash:</p>
                          <p className="font-mono text-xs break-all">{block.prevHash || "Genesis Block"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transaction Details</h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="font-mono text-sm break-all">{selectedTransaction.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(selectedTransaction.data.type)}`}
                >
                  {selectedTransaction.data.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <p>{getTransactionSummary(selectedTransaction)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actor</label>
                  <p>{selectedTransaction.data.actor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target</label>
                  <p>{selectedTransaction.data.target}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p>{new Date(selectedTransaction.data.timestamp).toLocaleString()}</p>
              </div>
              {selectedTransaction.data.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p>{selectedTransaction.data.ipAddress}</p>
                </div>
              )}
              {selectedTransaction.data.details && Object.keys(selectedTransaction.data.details).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Details</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedTransaction.data.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
